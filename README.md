# Dinank-v2.0 🎂 (दिनांक)

**Dinank v2.0** is an offline-first, Apple iOS Human Interface Guidelines (HIG)–inspired Birthday & Event Reminder mobile application built with React Native and Expo.

---

## ✨ Features

- **🍎 Apple iOS HIG Aesthetics**: Sleek dark/light modes, rounded grouped cards, fluid micro-haptics, and custom compound SVG tab bar icons.
- **⚡ 0ms Offline-First Architecture**: High-speed localized caching with asynchronous background persistence and instant startup.
- **📅 Interactive Apple Calendar Picker**: 7-column calendar date selector with smooth month navigation and quick birth year selector (1940 – Present).
- **📊 Spreadsheet & Google Sheets Importer**:
  - Direct `.xlsx`, `.xls`, and `.csv` device file picker via SheetJS.
  - Live public Google Sheet URL synchronization.
  - Paste raw tabular CSV text with auto-column detection (`Name`, `DOB`, `Class/Group`, `Roll No`, `Phone`, `Parent Phone`, `Email`, `Notes`).
- **📤 Data Export & Backup**: 1-tap Export to CSV spreadsheet and full JSON backup using the native system share sheet.
- **📞 1-Tap Direct Action Tools**:
  - Direct Phone Dialer (`tel:`)
  - Direct WhatsApp messaging (`whatsapp://`)
  - Direct SMS composer (`sms:`)
  - Direct Email client (`mailto:`)
  - 👨‍👩‍👧 **Wish Parents on WhatsApp**: Dedicated quick action to message parents.
- **🎨 Deep Personalization & Custom Templates**:
  - Custom sender/teacher name across greetings.
  - Dynamic greeting message template builder with token chips: `{name}`, `{age}`, `{class}`, `{sender_name}`.
  - Custom Parent WhatsApp greeting template.
- **🔔 Direct OS System Alarms & Reminders**: Local device notifications scheduled on birthday and day before.

---

## 🛠️ Tech Stack

- **Framework**: React Native 0.86, Expo SDK 57
- **Language**: TypeScript 5.8
- **Icons**: Lucide React Native & Custom Compound SVGs
- **Parser**: SheetJS (`xlsx`), Expo Document Picker
- **Notifications**: Expo Notifications
- **Haptics**: Expo Haptics
- **Storage**: AsyncStorage with in-memory fallback cache

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/ImBajrangi/Dinank-v2.0.git
cd Dinank-v2.0

# Install dependencies
npm install

# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

---

## 📄 License
MIT License
