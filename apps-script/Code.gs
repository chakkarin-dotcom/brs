
/**
 * Google Apps Script — REST API for "ระบบบริหารจัดการและแจ้งซ่อมบำรุง อาคารพจน์ สารสิน"
 *
 * How to deploy:
 *   1. เปิด Google Sheet → ส่วนขยาย (Extensions) → Apps Script
 *   2. วาง Code.gs ทั้งหมดในโปรเจกต์
 *   3. กด Deploy → New deployment → Type: Web app
 *      - Execute as: Me (your email)
 *      - Who has access: Anyone
 *   4. กด Deploy แล้วคัดลอก URL ที่ได้
 *   5. ไปตั้งค่าใน .env หรือกำหนด GOOGLE_SHEETS_WEBAPP_URL ในระบบ
 *
 * โครงสร้างชีตที่ต้องมี:
 *   - ชีต "Data" คอลัมน์ A = key, คอลัมน์ B = value (JSON string)
 *
 * ข้อมูลในชีต:
 *   key='categories'   → JSON string ของ array หมวดหมู่อุปกรณ์
 *   key='tickets'      → JSON string ของ array คำร้องแจ้งซ่อม
 *   key='officer'      → JSON string ของ object ข้อมูลเจ้าหน้าที่
 *   key='webhookUrl'   → string URL ของ Google Chat webhook
 */

var SHEET_NAME = 'Data';

/**
 * GET handler: อ่านข้อมูลจากชีตตาม key ที่ส่งมา
 * เรียก: GET {webapp-url}?key=tickets
 */
function doGet(e) {
  var key = e.parameter.key;

  if (!key) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Missing "key" parameter' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Sheet not found. Create a sheet named "Data"' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var value = null;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        value = data[i][1];
        break;
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ data: value }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST handler: เขียนข้อมูลลงชีตตาม key ที่ส่งมา
 * รองรับทั้ง form-encoded (hidden form submission ≈ ไม่มี CORS)
 * และ JSON body (sendBeacon)
 */
function doPost(e) {
  try {
    // รองรับทั้ง form-encoded (hidden form) และ JSON body (sendBeacon/fetch)
    var key, value, notifyEmail, notifySubject, notifyBody;
    if (e.parameter && e.parameter.key !== undefined) {
      key = e.parameter.key;
      value = e.parameter.value;
      notifyEmail = e.parameter.notifyEmail;
      notifySubject = e.parameter.notifySubject;
      notifyBody = e.parameter.notifyBody;
    } else if (e.postData && e.postData.contents) {
      var req = JSON.parse(e.postData.contents);
      key = req.key;
      value = req.value;
      notifyEmail = req.notifyEmail;
      notifySubject = req.notifySubject;
      notifyBody = req.notifyBody;
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'No data received' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── ส่ง webhook ไปยัง Google Chat (ผ่าน server เพื่อเลี่ยง CORS) ──
    if (key === '__gchat' && value) {
      var webhookData = getSheetValue('webhookUrl');
      if (webhookData) {
        UrlFetchApp.fetch(webhookData, {
          method: 'POST',
          contentType: 'application/json',
          payload: JSON.stringify({ text: value }),
          muteHttpExceptions: true,
        });
      }
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── ส่งอีเมลผ่าน MailApp ──
    if (notifyEmail && notifySubject && notifyBody) {
      MailApp.sendEmail(notifyEmail, notifySubject, notifyBody);
    }

    if (!key || value === undefined) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Missing "key" or "value" in request body' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Sheet not found. Create a sheet named "Data"' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var foundRow = -1;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        foundRow = i + 1; // 1-indexed for sheet
        break;
      }
    }

    if (foundRow > 0) {
      sheet.getRange(foundRow, 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, key: key }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * อ่านค่าจากชีต Data ตาม key
 */
function getSheetValue(key) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

/**
 * ฟังก์ชันสำหรับ initialize ชีตและข้อมูลเริ่มต้น
 * 1. ไปที่ Apps Script Editor
 * 2. เลือกฟังก์ชัน setupInitialData
 * 3. กด Run (ต้องให้ permissions ครั้งแรก)
 */
function setupInitialData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['key', 'value']);
  } else {
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
    }
  }

  var initialCategories = [
    {
      id: 'building-sys', name: 'ระบบประกอบอาคาร', code: 'BLD',
      description: 'ระบบปรับอากาศ ไฟฟ้าส่องสว่าง ประปาอาคาร ปั้มน้ำ แทงค์น้ำ และลิฟท์โดยสาร',
      iconName: 'Building2', color: '#0284c7',
      items: [
        { id: 'bld-ac', name: 'เครื่องปรับอากาศ', description: 'แอร์ไม่เย็น, น้ำหยด, มีเสียงดัง, ไม่ติด' },
        { id: 'bld-light', name: 'หลอดไฟ', description: 'หลอดขาด, ไฟกะพริบ, บัลลาสต์ชำรุด, สวิตช์เสีย' },
        { id: 'bld-plumb', name: 'น้ำประปา', description: 'ท่อแตก, ท่อรั่วซึม, น้ำไม่ไหล, วาล์วชำรุด' },
        { id: 'bld-pump', name: 'ปั้มน้ำ', description: 'ปั้มน้ำไม่ทำงาน, แรงดันตก, ทำงานตลอดเวลา' },
        { id: 'bld-tank', name: 'แทงค์น้ำ', description: 'ลูกลอยเสีย, น้ำล้นแทงค์, รั่วซึม, ตรวจสอบความสะอาด' },
        { id: 'bld-lift', name: 'ลิฟท์โดยสาร', description: 'ลิฟท์ค้าง, ประตูไม่ปิด, มีเสียงเตือน, ไฟปุ่มกดเสีย' },
      ],
    },
    {
      id: 'classroom-av', name: 'ระบบโสตทัศนูปกรณ์ในห้องเรียน', code: 'AV',
      description: 'คอมพิวเตอร์ เครื่องเสียง ไมโครโฟน โปรเจ็คเตอร์ และสื่อการสอนในห้องบรรยาย',
      iconName: 'Tv', color: '#7c3aed',
      items: [
        { id: 'av-pc', name: 'คอมพิวเตอร์แบบตั้งโต๊ะ', description: 'เครื่องไม่บูต, จอไม่ติด, เมาส์/คีย์บอร์ดเสีย' },
        { id: 'av-laptop', name: 'คอมพิวเตอร์แบบพกพา', description: 'โน้ตบุ๊กสำหรับผู้สอน, สายชาร์จชำรุด' },
        { id: 'av-sound', name: 'เครื่องเสียง', description: 'แอมป์ขยายเสียงไม่ดัง, เสียงหวีด, ไมโครโฟนดับ' },
        { id: 'av-speaker', name: 'ลำโพง', description: 'เสียงแตก, ลำโพงเพดานดับ, สายสัญญาณหลุด' },
        { id: 'av-projector', name: 'โปรเจ็คเตอร์', description: 'ภาพมืด, หลอดภาพหมดอายุ, สีเพี้ยน, สัญญาณไม่เข้า' },
        { id: 'av-tv', name: 'โทรทัศน์', description: 'Smart TV เปิดไม่ติด, รีโมทเสีย, ภาพไม่ขึ้น' },
        { id: 'av-visualizer', name: 'เครื่องฉายสามมิติ', description: 'Visualizer กล้องไม่โฟกัส, ไฟฉายไม่สว่าง' },
      ],
    },
    {
      id: 'security-sys', name: 'ระบบรักษาความปลอดภัย', code: 'SEC',
      description: 'กล้องวงจรปิดรอบอาคาร และระบบไม้กั้นอัตโนมัติ',
      iconName: 'ShieldCheck', color: '#dc2626',
      items: [
        { id: 'sec-cctv', name: 'กล้องวงจรปิด', description: 'ภาพดับ, บันทึกไม่ได้, มุมกล้องเคลื่อน, สัญญาณหลุด' },
        { id: 'sec-barrier', name: 'ไม้กั้น', description: 'ไม้กั้นไม่ยกขึ้น, คีย์การ์ดไม่สแกน, มอเตอร์ค้าง' },
      ],
    },
    {
      id: 'utilities-sys', name: 'ระบบสาธารณูปโภค', code: 'UTL',
      description: 'น้ำดื่มบริการนักศึกษา เครื่องกรองน้ำ และระบบจ่ายน้ำประปา',
      iconName: 'Droplet', color: '#059669',
      items: [
        { id: 'utl-water-dispenser', name: 'น้ำดื่ม', description: 'ตู้กดน้ำร้อน-เย็นไม่เย็น, ก๊อกน้ำรั่ว' },
        { id: 'utl-filter', name: 'เครื่องกรองน้ำ', description: 'เปลี่ยนไส้กรอง, น้ำมีกลิ่น, แรงดันน้ำผ่านกรองเบา' },
        { id: 'utl-tap', name: 'น้ำประปา', description: 'จุดจ่ายน้ำสาธารณะ, ท่อเมนต์หลัก' },
      ],
    },
    {
      id: 'sanitary-sys', name: 'ระบบสุขาภิบาล', code: 'SAN',
      description: 'สุขภัณฑ์ สายฉีดชำระ โถปัสสาวะ โถชักโครก และห้องน้ำทุกชั้น',
      iconName: 'Sparkles', color: '#d97706',
      items: [
        { id: 'san-spray', name: 'สายฉีดชำระ', description: 'หัวฉีดรั่วซึม, สายแตก, วาล์วกดไม่เด้งคืน' },
        { id: 'san-urinal', name: 'โถปัสสาวะ', description: 'เซ็นเซอร์กดน้ำไม่ทำงาน, ท่อระบายอุดตัน, มีกลิ่น' },
        { id: 'san-toilet', name: 'โถชักโครก', description: 'ชักโครกกดไม่ลง, ลูกลอยชักโครกค้าง, รั่วซึม' },
      ],
    },
    {
      id: 'physical-infra', name: 'ระบบกายภาพ', code: 'PHY',
      description: 'ลานจอดรถยนต์ ลานจอดจักรยานยนต์ และถนนทางเข้าอาคารพจน์ สารสิน',
      iconName: 'Car', color: '#4f46e5',
      items: [
        { id: 'phy-p1', name: 'ลานจอดรถยนต์ P1', description: 'พื้นชำรุด, เส้นจราจรเลือนราง, ป้ายบอกทางหัก' },
        { id: 'phy-p2', name: 'ลานจอดรถยนต์ P2', description: 'ไฟส่องสว่างลานจอด, ปัญหาน้ำท่วมขัง' },
        { id: 'phy-p3', name: 'ลานจอดรถยนต์ P3', description: 'หลุมบ่อ, รั้วชำรุด, แผงกั้นเสียหาย' },
        { id: 'phy-p4', name: 'ลานจอดรถจักรยายนต์ P4', description: 'หลังคาโรงจอดรั่ว, ช่องจอดชำรุด' },
        { id: 'phy-p5', name: 'ลานจอดรถจักรยานยนต์ P5', description: 'ไฟส่องสว่าง, รางระบายน้ำอุดตัน' },
        { id: 'phy-p3-road', name: 'ถนนเส้นใหม่ทางเข้าลานจอดรถยนต์ P3', description: 'ผิวถนนแอสฟัลต์ทรุดตัว, ฝาท่อระบายน้ำขยับ, ป้ายจราจร' },
      ],
    },
  ];

  var initialOfficer = {
    name: 'นายจักรินทร์ ศิลารัตน์',
    position: 'นักเทคโนโลยีสารสนเทศ ชำนาญการ',
    organization: 'สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น',
    internalPhone: '44843',
    mobilePhone: '089-9419494',
    email: 'chakkarin@kku.ac.th',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    availabilityStatus: 'on_duty',
    workHours: 'จันทร์ - ศุกร์ 08:30 - 16:30 น. (กรณีฉุกเฉินติดต่อได้ 24 ชม.)',
  };

  sheet.appendRow(['categories', JSON.stringify(initialCategories)]);
  sheet.appendRow(['tickets', JSON.stringify([])]);
  sheet.appendRow(['officer', JSON.stringify(initialOfficer)]);

  SpreadsheetApp.getUi().alert(
    '✅ ตั้งค่าข้อมูลเริ่มต้นสำเร็จ!\n\n' +
    'ชีต "Data" ถูกสร้างและเติมข้อมูล Categories, Officer เรียบร้อย\n\n' +
    'ขั้นตอนต่อไป:\n' +
    '1. Deploy เป็น Web App (Deploy → New deployment → Web app)\n' +
'2. นำ URL ที่ได้ไปกำหนดใน GOOGLE_SHEETS_WEBAPP_URL ของระบบ'
  );
}