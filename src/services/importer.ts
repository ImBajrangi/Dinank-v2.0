import { Birthday, RelationshipType, ReminderOption } from '../types/birthday';
import { AVATAR_COLORS } from '../constants/theme';
import * as Crypto from 'expo-crypto';
import * as XLSX from 'xlsx';

export interface ImportedBirthdayItem extends Birthday {
  sourceFile?: string;
  sourceType?: 'file' | 'sheet' | 'text';
}

export interface ParsedImportResult {
  successful: ImportedBirthdayItem[];
  errors: string[];
  totalRows: number;
  fileNames: string[];
}

export type SegregationDimension = 'session' | 'class' | 'section' | 'relationship' | 'source';

export interface SegregatedGroup {
  id: string;
  label: string;
  subLabel?: string;
  count: number;
  items: ImportedBirthdayItem[];
}

export class ImporterService {
  /**
   * Helper to check if a row looks like a table header
   */
  static isHeaderRow(row: any[]): boolean {
    if (!row || !Array.isArray(row) || row.length === 0) return false;
    const strRow = row.map((cell) => String(cell || '').trim().toLowerCase());
    const hasName = strRow.some((col) =>
      [
        'name',
        'student name',
        'student_name',
        'fullname',
        'full name',
        'person',
        'contact name',
        'student',
      ].some((k) => col.includes(k))
    );
    const hasOther = strRow.some((col) =>
      [
        'dob',
        'birth date',
        'birth_date',
        'birthday',
        'date of birth',
        'dateofbirth',
        'bday',
        'course',
        'class',
        'grade',
        'dept',
        'department',
        'section',
        'sec',
        'session',
        'roll',
        'rollno',
        'parent',
        'phone',
        'mobile',
        'email',
        'semester',
        'specialization',
      ].some((k) => col.includes(k))
    );
    return hasName && hasOther;
  }

  /**
   * Parse binary / ArrayBuffer Excel (.xlsx, .xls) or CSV file with multi-sheet and multi-table support
   */
  static parseExcelOrCSVBuffer(
    buffer: ArrayBuffer,
    fileName?: string,
    sourceType: 'file' | 'sheet' | 'text' = 'file'
  ): ParsedImportResult {
    try {
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return {
          successful: [],
          errors: [`No sheets found in ${fileName || 'Excel file'}`],
          totalRows: 0,
          fileNames: fileName ? [fileName] : [],
        };
      }

      const allSuccessful: ImportedBirthdayItem[] = [];
      const allErrors: string[] = [];
      let totalRows = 0;
      const fileNames: string[] = [];

      const isMultiSheet = workbook.SheetNames.length > 1;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        if (!rows || rows.length === 0) continue;

        // Clean distinct label: Use the exact sheet/table name directly (e.g. 'Sheet1', 'Sheet1 (1)', 'BCA')
        let sheetTag = (sheetName || '').trim();
        if (!sheetTag) {
          sheetTag = fileName || 'Table';
        }

        const res = this.parseSheetRowsWithMultiTables(rows, sheetTag, sourceType);
        allSuccessful.push(...res.successful);
        allErrors.push(...res.errors);
        totalRows += res.totalRows;
        fileNames.push(...res.fileNames);
      }

      return {
        successful: allSuccessful,
        errors: allErrors,
        totalRows,
        fileNames: Array.from(new Set(fileNames)),
      };
    } catch (e: any) {
      return {
        successful: [],
        errors: [`Failed to parse ${fileName || 'file'}: ${e.message || String(e)}`],
        totalRows: 0,
        fileNames: fileName ? [fileName] : [],
      };
    }
  }

  /**
   * Batch parse multiple spreadsheet files/buffers at once
   */
  static parseMultipleFilesOrBuffers(
    files: { name: string; buffer: ArrayBuffer }[]
  ): ParsedImportResult {
    const allSuccessful: ImportedBirthdayItem[] = [];
    const allErrors: string[] = [];
    let totalRows = 0;
    const fileNames: string[] = [];

    for (const f of files) {
      const res = this.parseExcelOrCSVBuffer(f.buffer, f.name, 'file');
      allSuccessful.push(...res.successful);
      allErrors.push(...res.errors);
      totalRows += res.totalRows;
      fileNames.push(...res.fileNames);
    }

    return {
      successful: allSuccessful,
      errors: allErrors,
      totalRows,
      fileNames: Array.from(new Set(fileNames)),
    };
  }

  /**
   * Detects and extracts multiple separated tables within a single sheet's row array
   */
  static parseSheetRowsWithMultiTables(
    rows: any[][],
    baseTag: string,
    sourceType: 'file' | 'sheet' | 'text' = 'file'
  ): ParsedImportResult {
    // Find all header rows within the sheet
    const headerIndices: number[] = [];
    rows.forEach((row, idx) => {
      if (this.isHeaderRow(row)) {
        headerIndices.push(idx);
      }
    });

    // If multiple header rows are detected in a single sheet
    if (headerIndices.length > 1) {
      const allSuccessful: ImportedBirthdayItem[] = [];
      const allErrors: string[] = [];
      let totalRows = 0;
      const fileNames: string[] = [];

      for (let t = 0; t < headerIndices.length; t++) {
        const start = headerIndices[t];
        const end = t + 1 < headerIndices.length ? headerIndices[t + 1] : rows.length;
        const tableRows = rows.slice(start, end);
        const tableTag = `${baseTag} • Table ${t + 1}`;

        const res = this.parseSheetRows(tableRows, tableTag, sourceType);
        allSuccessful.push(...res.successful);
        allErrors.push(...res.errors);
        totalRows += res.totalRows;
        fileNames.push(tableTag);
      }

      return {
        successful: allSuccessful,
        errors: allErrors,
        totalRows,
        fileNames,
      };
    }

    // Standard single table sheet
    return this.parseSheetRows(rows, baseTag, sourceType);
  }

  /**
   * Parse 2D array of rows from a single table
   */
  static parseSheetRows(
    rows: any[][],
    fileName?: string,
    sourceType: 'file' | 'sheet' | 'text' = 'file'
  ): ParsedImportResult {
    const successful: ImportedBirthdayItem[] = [];
    const errors: string[] = [];

    // Filter out completely blank rows
    const nonEmptyRows = rows.filter(
      (r) =>
        r &&
        r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );

    if (nonEmptyRows.length === 0) {
      return {
        successful,
        errors: [`Spreadsheet '${fileName || 'data'}' is empty`],
        totalRows: 0,
        fileNames: fileName ? [fileName] : [],
      };
    }

    // Header detection & column mapping
    const headerRow = nonEmptyRows[0].map((h) =>
      String(h || '')
        .trim()
        .toLowerCase()
        .replace(/[\s_\-#]+/g, '')
    );

    let nameIdx = -1;
    let dobIdx = -1;
    let relIdx = -1;
    let classIdx = -1;
    let sectionIdx = -1;
    let sessionIdx = -1;
    let rollIdx = -1;
    let phoneIdx = -1;
    let parentPhoneIdx = -1;
    let emailIdx = -1;
    let notesIdx = -1;
    let specializationIdx = -1;
    let semesterIdx = -1;

    headerRow.forEach((col, idx) => {
      if (
        ['name', 'studentname', 'fullname', 'person', 'contactname', 'student'].some((k) =>
          col.includes(k)
        )
      ) {
        if (nameIdx === -1) nameIdx = idx;
      } else if (
        ['dob', 'birthdate', 'birthday', 'bday', 'dateofbirth'].some((k) => col.includes(k))
      ) {
        if (dobIdx === -1) dobIdx = idx;
      } else if (
        ['session', 'batchyear', 'academicyear', 'acadyear', 'admissionyear'].some((k) =>
          col.includes(k)
        )
      ) {
        if (sessionIdx === -1) sessionIdx = idx;
      } else if (['section', 'sec', 'batch', 'division'].some((k) => col.includes(k))) {
        if (sectionIdx === -1) sectionIdx = idx;
      } else if (
        [
          'class',
          'grade',
          'dept',
          'department',
          'course',
          'group',
          'branch',
          'standard',
          'stream',
          'program',
          'degree',
        ].some((k) => col.includes(k))
      ) {
        if (classIdx === -1) classIdx = idx;
      } else if (
        ['parent', 'father', 'mother', 'guardian', 'parentphone', 'parentcontact'].some((k) =>
          col.includes(k)
        )
      ) {
        if (parentPhoneIdx === -1) parentPhoneIdx = idx;
      } else if (
        ['phone', 'mobile', 'whatsapp', 'contact', 'tel', 'phoneno', 'studentphone'].some((k) =>
          col.includes(k)
        )
      ) {
        if (phoneIdx === -1) phoneIdx = idx;
      } else if (
        ['roll', 'reg', 'id', 'studentid', 'rollno', 'admno', 'enrollment'].some((k) =>
          col.includes(k)
        )
      ) {
        if (rollIdx === -1) rollIdx = idx;
      } else if (['specialization', 'spec', 'major', 'minor'].some((k) => col.includes(k))) {
        if (specializationIdx === -1) specializationIdx = idx;
      } else if (['semester', 'sem'].some((k) => col.includes(k))) {
        if (semesterIdx === -1) semesterIdx = idx;
      } else if (['relation', 'relationship', 'category', 'type'].some((k) => col.includes(k))) {
        if (relIdx === -1) relIdx = idx;
      } else if (['email', 'mail', 'emailaddress'].some((k) => col.includes(k))) {
        if (emailIdx === -1) emailIdx = idx;
      } else if (['note', 'notes', 'remark', 'remarks', 'comment'].some((k) => col.includes(k))) {
        if (notesIdx === -1) notesIdx = idx;
      }
    });

    // If DOB header was not found by name, scan columns to detect which column has dates
    if (dobIdx === -1) {
      for (let c = 0; c < (nonEmptyRows[0]?.length || 0); c++) {
        for (let r = 0; r < Math.min(5, nonEmptyRows.length); r++) {
          if (this.normalizeDate(nonEmptyRows[r][c])) {
            dobIdx = c;
            break;
          }
        }
        if (dobIdx !== -1) break;
      }
    }

    // If Name header was not found, scan for name column or use column 0
    if (nameIdx === -1) {
      nameIdx = 0;
    }

    const tag = fileName || (sourceType === 'sheet' ? 'Google Sheet' : 'Pasted Data');

    // If NO column in this entire table contains any dates, it's not a birthday table
    if (dobIdx === -1) {
      return {
        successful: [],
        errors: [`'${tag}' has no Birthday / Date of Birth column (skipped)`],
        totalRows: 0,
        fileNames: [],
      };
    }

    let startIndex = 1;
    // Check if row 0 was actually a data row rather than a header
    if (this.normalizeDate(nonEmptyRows[0][dobIdx])) {
      startIndex = 0;
    }

    for (let i = startIndex; i < nonEmptyRows.length; i++) {
      const row = nonEmptyRows[i];
      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
      const rawDate = dobIdx !== -1 ? row[dobIdx] : '';

      if (!name) {
        errors.push(`[${tag}] Row ${i + 1}: Name is missing`);
        continue;
      }

      const formattedDate = this.normalizeDate(rawDate);
      if (!formattedDate) {
        errors.push(`[${tag}] Row ${i + 1} (${name}): Invalid birthday date '${rawDate}'`);
        continue;
      }

      const rawRel = relIdx !== -1 && row[relIdx] ? String(row[relIdx]).trim().toLowerCase() : '';
      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : undefined;
      const groupClass = classIdx !== -1 && row[classIdx] ? String(row[classIdx]).trim() : undefined;
      const section = sectionIdx !== -1 && row[sectionIdx] ? String(row[sectionIdx]).trim() : undefined;
      const session = sessionIdx !== -1 && row[sessionIdx] ? String(row[sessionIdx]).trim() : undefined;
      const rollNo = rollIdx !== -1 && row[rollIdx] ? String(row[rollIdx]).trim() : undefined;
      const parentPhone = parentPhoneIdx !== -1 && row[parentPhoneIdx] ? String(row[parentPhoneIdx]).trim() : undefined;
      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : undefined;

      // Extract notes, and append Specialization / Semester if present
      const rawNotes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : '';
      const spec = specializationIdx !== -1 && row[specializationIdx] ? String(row[specializationIdx]).trim() : '';
      const sem = semesterIdx !== -1 && row[semesterIdx] ? String(row[semesterIdx]).trim() : '';

      const noteParts: string[] = [];
      if (rawNotes) noteParts.push(rawNotes);
      if (spec) noteParts.push(`Spec: ${spec}`);
      if (sem) noteParts.push(`Sem: ${sem}`);
      const notes = noteParts.length > 0 ? noteParts.join(' • ') : undefined;

      let rel: RelationshipType = 'friend';
      if (['student', 'students'].includes(rawRel)) {
        rel = 'student';
      } else if (['family', 'friend', 'work', 'other'].includes(rawRel)) {
        rel = rawRel as RelationshipType;
      } else if (groupClass || section || session || rollNo || parentPhone || spec || sem) {
        rel = 'student';
      }

      const nowIso = new Date().toISOString();
      const defaultReminders: ReminderOption[] = [
        { id: '1', timing: 'on_day', time: '09:00', enabled: true },
        { id: '2', timing: 'day_before', time: '09:00', enabled: true },
      ];

      successful.push({
        id: Crypto.randomUUID ? Crypto.randomUUID() : `bday_${Date.now()}_${Math.random()}`,
        name,
        birthDate: formattedDate,
        relationship: rel,
        phone,
        groupClass,
        section,
        session,
        rollNo,
        parentPhone,
        email,
        notes,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        reminders: defaultReminders,
        createdAt: nowIso,
        updatedAt: nowIso,
        sourceFile: tag,
        sourceType,
      });
    }

    return {
      successful,
      errors,
      totalRows: nonEmptyRows.length - (startIndex === 1 ? 1 : 0),
      fileNames: fileName ? [fileName] : [],
    };
  }

  /**
   * Parse CSV / Tabular text format
   */
  static parseCSVText(rawText: string, fileName?: string): ParsedImportResult {
    try {
      const workbook = XLSX.read(rawText, { type: 'string', cellDates: true });
      if (workbook.SheetNames && workbook.SheetNames.length > 0) {
        const allSuccessful: ImportedBirthdayItem[] = [];
        const allErrors: string[] = [];
        let totalRows = 0;
        const fileNames: string[] = [];

        const isMultiSheet = workbook.SheetNames.length > 1;

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
          const sheetTag = isMultiSheet
            ? `${fileName || 'Pasted Data'} • ${sheetName}`
            : (fileName || sheetName);

          const res = this.parseSheetRowsWithMultiTables(rows, sheetTag, 'text');
          allSuccessful.push(...res.successful);
          allErrors.push(...res.errors);
          totalRows += res.totalRows;
          fileNames.push(...res.fileNames);
        }

        return {
          successful: allSuccessful,
          errors: allErrors,
          totalRows,
          fileNames: Array.from(new Set(fileNames)),
        };
      }
      const lines = rawText.split(/\r?\n/).map((l) => l.split(','));
      return this.parseSheetRowsWithMultiTables(lines, fileName || 'Pasted Data', 'text');
    } catch (e) {
      const lines = rawText.split(/\r?\n/).map((l) => l.split(','));
      return this.parseSheetRowsWithMultiTables(lines, fileName || 'Pasted Data', 'text');
    }
  }

  /**
   * Fetch and parse public Google Sheet URL (Extracts all sheets/tables via XLSX workbook export)
   */
  static async importFromGoogleSheetUrl(url: string, index = 1): Promise<ParsedImportResult> {
    try {
      const cleanUrl = url.trim();
      let docId = '';
      const idMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (idMatch && idMatch[1]) {
        docId = idMatch[1];
      }

      const sourceLabel = `Google Sheet #${index}`;

      if (docId) {
        // 1. Try XLSX export first (contains ALL sheets and tables in the workbook)
        try {
          const xlsxExportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=xlsx`;
          const response = await fetch(xlsxExportUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const parsed = this.parseExcelOrCSVBuffer(arrayBuffer, sourceLabel, 'sheet');
            if (parsed.successful.length > 0) {
              return parsed;
            }
          }
        } catch (xlsxErr) {
          // XLSX failed, fallback to CSV
        }

        // 2. Fallback to CSV export
        let csvExportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
        const gidMatch = cleanUrl.match(/[?&#]gid=([0-9]+)/);
        if (gidMatch && gidMatch[1]) {
          csvExportUrl += `&gid=${gidMatch[1]}`;
        }

        const csvResponse = await fetch(csvExportUrl);
        if (csvResponse.ok) {
          const csvText = await csvResponse.text();
          return this.parseCSVText(csvText, sourceLabel);
        }
      }

      // 3. Fallback direct fetch
      const response = await fetch(cleanUrl);
      if (!response.ok) {
        return {
          successful: [],
          errors: [
            `Failed to fetch Google Sheet #${index} (Status ${response.status}). Ensure sheet sharing is 'Anyone with the link can view'.`,
          ],
          totalRows: 0,
          fileNames: [sourceLabel],
        };
      }
      const text = await response.text();
      return this.parseCSVText(text, sourceLabel);
    } catch (e: any) {
      return {
        successful: [],
        errors: [`Google Sheet #${index} error: ${e.message || String(e)}`],
        totalRows: 0,
        fileNames: [`Google Sheet #${index}`],
      };
    }
  }

  /**
   * Batch fetch and parse multiple Google Sheet URLs in parallel
   */
  static async importFromMultipleGoogleSheetUrls(urls: string[]): Promise<ParsedImportResult> {
    const cleanUrls = urls.map((u) => u.trim()).filter((u) => u.length > 5);
    if (cleanUrls.length === 0) {
      return { successful: [], errors: ['No valid URLs provided'], totalRows: 0, fileNames: [] };
    }

    const results = await Promise.all(
      cleanUrls.map((url, idx) => this.importFromGoogleSheetUrl(url, idx + 1))
    );

    const allSuccessful: ImportedBirthdayItem[] = [];
    const allErrors: string[] = [];
    let totalRows = 0;
    const fileNames: string[] = [];

    results.forEach((res) => {
      allSuccessful.push(...res.successful);
      allErrors.push(...res.errors);
      totalRows += res.totalRows;
      fileNames.push(...res.fileNames);
    });

    return {
      successful: allSuccessful,
      errors: allErrors,
      totalRows,
      fileNames: Array.from(new Set(fileNames)),
    };
  }

  /**
   * Segregates parsed contacts dynamically by the chosen dimension
   */
  static groupParsedItems(
    items: ImportedBirthdayItem[],
    dimension: SegregationDimension
  ): SegregatedGroup[] {
    const map = new Map<string, ImportedBirthdayItem[]>();

    items.forEach((item) => {
      let key = 'Other';
      if (dimension === 'session') {
        key = item.session?.trim() || 'Unassigned Session';
      } else if (dimension === 'class') {
        key = item.groupClass?.trim() || 'General / Unclassified';
      } else if (dimension === 'section') {
        key = item.section?.trim() ? `Section ${item.section.trim()}` : 'Default Batch';
      } else if (dimension === 'relationship') {
        key =
          item.relationship.charAt(0).toUpperCase() + item.relationship.slice(1) ||
          'Friend';
      } else if (dimension === 'source') {
        key = (item.sourceFile || 'Imported Table')
          .replace(/^Google\s*Sheet\s*#?\d*\s*[•\-–:]\s*/i, '')
          .replace(/^Spreadsheet\s*[•\-–:]\s*/i, '')
          .trim() || 'Table 1';
      }

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    });

    const groups: SegregatedGroup[] = [];
    map.forEach((groupItems, key) => {
      groups.push({
        id: key,
        label: key,
        count: groupItems.length,
        items: groupItems,
      });
    });

    // Sort groups alphabetically with 'Unassigned' or 'Other' at the end
    groups.sort((a, b) => {
      if (a.label.startsWith('Unassigned') || a.label.startsWith('Other')) return 1;
      if (b.label.startsWith('Unassigned') || b.label.startsWith('Other')) return -1;
      return a.label.localeCompare(b.label);
    });

    return groups;
  }

  /**
   * Normalize various date strings or Date objects to YYYY-MM-DD
   */
  static normalizeDate(raw: any): string | null {
    if (raw === null || raw === undefined || raw === '') return null;

    if (raw instanceof Date) {
      if (isNaN(raw.getTime())) return null;
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, '0');
      const d = String(raw.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Excel numeric date serials (e.g., 38607 for year 2005)
    if (typeof raw === 'number' && raw > 1000 && raw < 100000) {
      try {
        const excelDate = new Date(Math.round((raw - 25569) * 86400 * 1000));
        if (!isNaN(excelDate.getTime())) {
          const y = excelDate.getFullYear();
          const m = String(excelDate.getMonth() + 1).padStart(2, '0');
          const d = String(excelDate.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
      } catch (e) {}
    }

    const str = String(raw).trim();
    if (!str) return null;

    const clean = str.replace(/\//g, '-').replace(/\./g, '-');

    // Pattern 1: YYYY-MM-DD
    const ymd = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      const y = parseInt(ymd[1], 10);
      const m = String(parseInt(ymd[2], 10)).padStart(2, '0');
      const d = String(parseInt(ymd[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Pattern 2: DD-MM-YYYY (or DD/MM/YYYY)
    const dmy = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmy) {
      const d = String(parseInt(dmy[1], 10)).padStart(2, '0');
      const m = String(parseInt(dmy[2], 10)).padStart(2, '0');
      const y = parseInt(dmy[3], 10);
      return `${y}-${m}-${d}`;
    }

    // Fallback Date parser
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }

  /**
   * Export contacts to CSV format
   */
  static exportToCSV(birthdays: Birthday[]): string {
    const headers = [
      'Name',
      'BirthDate',
      'Relationship',
      'Class/Course',
      'Section',
      'Session',
      'RollNo',
      'Phone',
      'ParentPhone',
      'Email',
      'Notes',
    ];

    const rows = birthdays.map((b) => [
      `"${(b.name || '').replace(/"/g, '""')}"`,
      `"${b.birthDate}"`,
      `"${b.relationship || 'friend'}"`,
      `"${(b.groupClass || '').replace(/"/g, '""')}"`,
      `"${(b.section || '').replace(/"/g, '""')}"`,
      `"${(b.session || '').replace(/"/g, '""')}"`,
      `"${(b.rollNo || '').replace(/"/g, '""')}"`,
      `"${(b.phone || '').replace(/"/g, '""')}"`,
      `"${(b.parentPhone || '').replace(/"/g, '""')}"`,
      `"${(b.email || '').replace(/"/g, '""')}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
