import { Birthday, RelationshipType, ReminderOption } from '../types/birthday';
import { AVATAR_COLORS } from '../constants/theme';
import * as Crypto from 'expo-crypto';
import * as XLSX from 'xlsx';

export interface ParsedImportResult {
  successful: Birthday[];
  errors: string[];
  totalRows: number;
  fileName?: string;
}

export class ImporterService {
  /**
   * Parse binary / ArrayBuffer / base64 Excel (.xlsx, .xls) or CSV file
   */
  static parseExcelOrCSVBuffer(buffer: ArrayBuffer, fileName?: string): ParsedImportResult {
    try {
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        return { successful: [], errors: ['No sheets found in Excel file'], totalRows: 0, fileName };
      }
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      return this.parseSheetRows(rows, fileName);
    } catch (e: any) {
      return {
        successful: [],
        errors: [`Failed to parse Excel file: ${e.message || String(e)}`],
        totalRows: 0,
        fileName,
      };
    }
  }

  /**
   * Parse 2D array of rows from Excel or CSV
   */
  static parseSheetRows(rows: any[][], fileName?: string): ParsedImportResult {
    const successful: Birthday[] = [];
    const errors: string[] = [];

    // Filter out completely blank rows
    const nonEmptyRows = rows.filter((r) => r && r.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''));

    if (nonEmptyRows.length === 0) {
      return { successful, errors: ['Spreadsheet is empty'], totalRows: 0, fileName };
    }

    // Header detection & column mapping
    const headerRow = nonEmptyRows[0].map((h) => String(h || '').trim().toLowerCase());
    
    let nameIdx = -1;
    let dobIdx = -1;
    let relIdx = -1;
    let classIdx = -1;
    let rollIdx = -1;
    let phoneIdx = -1;
    let parentPhoneIdx = -1;
    let emailIdx = -1;
    let notesIdx = -1;

    headerRow.forEach((col, idx) => {
      if (['name', 'student name', 'student_name', 'fullname', 'full name', 'person', 'contact name'].some((k) => col.includes(k))) {
        if (nameIdx === -1) nameIdx = idx;
      } else if (['dob', 'birth date', 'birth_date', 'birthday', 'bday', 'date of birth'].some((k) => col.includes(k))) {
        if (dobIdx === -1) dobIdx = idx;
      } else if (['parent', 'father', 'mother', 'guardian'].some((k) => col.includes(k))) {
        if (parentPhoneIdx === -1) parentPhoneIdx = idx;
      } else if (['phone', 'mobile', 'whatsapp', 'contact', 'tel'].some((k) => col.includes(k))) {
        if (phoneIdx === -1) phoneIdx = idx;
      } else if (['class', 'batch', 'section', 'grade', 'dept', 'group'].some((k) => col.includes(k))) {
        if (classIdx === -1) classIdx = idx;
      } else if (['roll', 'reg', 'id', 'student_id'].some((k) => col.includes(k))) {
        if (rollIdx === -1) rollIdx = idx;
      } else if (['relation', 'relationship', 'category', 'type'].some((k) => col.includes(k))) {
        if (relIdx === -1) relIdx = idx;
      } else if (['email', 'mail', 'e-mail'].some((k) => col.includes(k))) {
        if (emailIdx === -1) emailIdx = idx;
      } else if (['note', 'notes', 'remark', 'remarks', 'comment'].some((k) => col.includes(k))) {
        if (notesIdx === -1) notesIdx = idx;
      }
    });

    // If no header matches found, fallback to positional (Col 0 = Name, Col 1 = DOB)
    let startIndex = 1;
    if (nameIdx === -1 || dobIdx === -1) {
      // Check if row 0 was actually data without headers
      const dateTest = this.normalizeDate(nonEmptyRows[0][1]);
      if (dateTest) {
        startIndex = 0;
        nameIdx = 0;
        dobIdx = 1;
        relIdx = 2;
        phoneIdx = 3;
        classIdx = 4;
        parentPhoneIdx = 5;
        emailIdx = 6;
        notesIdx = 7;
      } else {
        nameIdx = 0;
        dobIdx = 1;
        startIndex = 1;
      }
    }

    for (let i = startIndex; i < nonEmptyRows.length; i++) {
      const row = nonEmptyRows[i];
      const name = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
      const rawDate = dobIdx !== -1 ? row[dobIdx] : '';

      if (!name) {
        errors.push(`Row ${i + 1}: Name is missing`);
        continue;
      }

      const formattedDate = this.normalizeDate(rawDate);
      if (!formattedDate) {
        errors.push(`Row ${i + 1} (${name}): Invalid birthday date '${rawDate}'`);
        continue;
      }

      const rawRel = relIdx !== -1 && row[relIdx] ? String(row[relIdx]).trim().toLowerCase() : 'friend';
      let rel: RelationshipType = 'friend';
      if (['family', 'friend', 'work', 'love', 'other'].includes(rawRel)) {
        rel = rawRel as RelationshipType;
      }

      const phone = phoneIdx !== -1 && row[phoneIdx] ? String(row[phoneIdx]).trim() : undefined;
      const groupClass = classIdx !== -1 && row[classIdx] ? String(row[classIdx]).trim() : undefined;
      const rollNo = rollIdx !== -1 && row[rollIdx] ? String(row[rollIdx]).trim() : undefined;
      const parentPhone = parentPhoneIdx !== -1 && row[parentPhoneIdx] ? String(row[parentPhoneIdx]).trim() : undefined;
      const email = emailIdx !== -1 && row[emailIdx] ? String(row[emailIdx]).trim() : undefined;
      const notes = notesIdx !== -1 && row[notesIdx] ? String(row[notesIdx]).trim() : undefined;

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
        rollNo,
        parentPhone,
        email,
        notes,
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        reminders: defaultReminders,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    return {
      successful,
      errors,
      totalRows: nonEmptyRows.length - (startIndex === 1 ? 1 : 0),
      fileName,
    };
  }

  /**
   * Parse CSV / Tabular text format
   */
  static parseCSVText(rawText: string, fileName?: string): ParsedImportResult {
    try {
      const workbook = XLSX.read(rawText, { type: 'string', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
      return this.parseSheetRows(rows, fileName);
    } catch (e) {
      // Fallback manual CSV split
      const lines = rawText.split(/\r?\n/).map((l) => l.split(','));
      return this.parseSheetRows(lines, fileName);
    }
  }

  /**
   * Fetch and parse public Google Sheet CSV URL
   */
  static async importFromGoogleSheetUrl(url: string): Promise<ParsedImportResult> {
    try {
      let exportUrl = url.trim();

      if (exportUrl.includes('docs.google.com/spreadsheets/d/')) {
        const idMatch = exportUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
          const docId = idMatch[1];
          exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv`;
        }
      }

      const response = await fetch(exportUrl);
      if (!response.ok) {
        return {
          successful: [],
          errors: [`Failed to fetch Google Sheet (Status ${response.status}). Ensure the sheet is viewable by anyone with link.`],
          totalRows: 0,
        };
      }

      const csvText = await response.text();
      return this.parseCSVText(csvText, 'GoogleSheet');
    } catch (e: any) {
      return {
        successful: [],
        errors: [`Network or parsing error: ${e.message || String(e)}`],
        totalRows: 0,
      };
    }
  }

  /**
   * Normalize various date strings or Date objects to YYYY-MM-DD
   */
  static normalizeDate(raw: any): string | null {
    if (!raw) return null;

    if (raw instanceof Date) {
      if (isNaN(raw.getTime())) return null;
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, '0');
      const d = String(raw.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const str = String(raw).trim();
    const clean = str.replace(/\//g, '-').replace(/\./g, '-');

    // Pattern 1: YYYY-MM-DD
    const ymd = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymd) {
      const y = parseInt(ymd[1], 10);
      const m = String(parseInt(ymd[2], 10)).padStart(2, '0');
      const d = String(parseInt(ymd[3], 10)).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Pattern 2: DD-MM-YYYY
    const dmy = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmy) {
      const d = String(parseInt(dmy[1], 10)).padStart(2, '0');
      const m = String(parseInt(dmy[2], 10)).padStart(2, '0');
      const y = parseInt(dmy[3], 10);
      return `${y}-${m}-${d}`;
    }

    // Pattern 3: MM-DD
    const md = clean.match(/^(\d{1,2})-(\d{1,2})$/);
    if (md) {
      const m = String(parseInt(md[1], 10)).padStart(2, '0');
      const d = String(parseInt(md[2], 10)).padStart(2, '0');
      return `2000-${m}-${d}`;
    }

    // Try Date.parse fallback
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return null;
  }

  /**
   * Export birthdays to CSV string
   */
  static exportToCSV(birthdays: Birthday[]): string {
    const headers = ['Name', 'BirthDate', 'Relationship', 'Phone', 'GroupClass', 'RollNo', 'ParentPhone', 'Email', 'Notes'];
    const rows = birthdays.map((b) => [
      `"${(b.name || '').replace(/"/g, '""')}"`,
      `"${b.birthDate}"`,
      `"${b.relationship || 'friend'}"`,
      `"${b.phone || ''}"`,
      `"${b.groupClass || ''}"`,
      `"${b.rollNo || ''}"`,
      `"${b.parentPhone || ''}"`,
      `"${b.email || ''}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
