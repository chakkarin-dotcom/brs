import { MaintenanceTicket, TicketStatus } from '../types';

/**
 * สร้างข้อความแจ้งเตือนสถานะงานซ่อมให้ผู้แจ้งเรื่อง
 * ใช้ร่วมกันทั้งการแจ้งอัตโนมัติ (auto-notify เมื่อสถานะเปลี่ยน)
 * และการแจ้งแบบกดเองผ่าน NotificationModal
 */
export function buildStatusNotificationMessage(
  ticket: MaintenanceTicket,
  status: TicketStatus
): string {
  const techInfo = ticket.assignedTechnician ? `\n👨‍🔧 ช่าง: ${ticket.assignedTechnician.name} (โทร ${ticket.assignedTechnician.phone})` : '';
const notesInfo = ticket.repairNotes ? `\n📝 หมายเหตุ: ${ticket.repairNotes}` : '';

const templates: Record<TicketStatus, string> = {
    pending: `เรียน คุณ${ticket.reporter.name}

━━━━━━━━━━━━━━━━━━━━━━━━
📬 รับเรื่องแจ้งซ่อมแล้ว
━━━━━━━━━━━━━━━━━━━━━━━━

รหัสคำร้อง: ${ticket.id}
รายการ: ${ticket.itemName}${ticket.categoryName ? ` (${ticket.categoryName})` : ''}
📍 สถานที่: อาคารพจน์ สารสิน ${ticket.location.floor} ${ticket.location.roomOrArea}${ticket.location.specificDetail ? ' (' + ticket.location.specificDetail + ')' : ''}

กำลังประสานงานช่างเข้าตรวจสอบจุดเกิดเหตุ

━━━━━━━━━━━━━━━━━━━━━━━━
ขอบคุณที่ใช้บริการ
สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
━━━━━━━━━━━━━━━━━━━━━━━━`,

    in_progress: `เรียน คุณ${ticket.reporter.name}

━━━━━━━━━━━━━━━━━━━━━━━━
🔧 กำลังดำเนินการ
━━━━━━━━━━━━━━━━━━━━━━━━

รหัสคำร้อง: ${ticket.id}
รายการ: ${ticket.itemName}${ticket.categoryName ? ` (${ticket.categoryName})` : ''}
📍 สถานที่: อาคารพจน์ สารสิน ${ticket.location.floor} ${ticket.location.roomOrArea}${ticket.location.specificDetail ? ' (' + ticket.location.specificDetail + ')' : ''}

ขณะนี้ช่างกำลังเข้าดำเนินการซ่อมแซมหน้างาน${techInfo}${notesInfo}

━━━━━━━━━━━━━━━━━━━━━━━━
ขอบคุณที่ใช้บริการ
สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
━━━━━━━━━━━━━━━━━━━━━━━━`,

    waiting_parts: `เรียน คุณ${ticket.reporter.name}

━━━━━━━━━━━━━━━━━━━━━━━━
⏳ รออะไหล่/อุปกรณ์
━━━━━━━━━━━━━━━━━━━━━━━━

รหัสคำร้อง: ${ticket.id}
รายการ: ${ticket.itemName}${ticket.categoryName ? ` (${ticket.categoryName})` : ''}
📍 สถานที่: อาคารพจน์ สารสิน ${ticket.location.floor} ${ticket.location.roomOrArea}

อยู่ระหว่างการรออะไหล่/อุปกรณ์เพิ่มเติม จะเข้าดำเนินการทันทีเมื่อของมาถึง${techInfo}${notesInfo}

━━━━━━━━━━━━━━━━━━━━━━━━
ขอบคุณที่ใช้บริการ
สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
━━━━━━━━━━━━━━━━━━━━━━━━`,

    completed: `เรียน คุณ${ticket.reporter.name}

━━━━━━━━━━━━━━━━━━━━━━━━
✅ ดำเนินการแล้วเสร็จ
━━━━━━━━━━━━━━━━━━━━━━━━

รหัสคำร้อง: ${ticket.id}
รายการ: ${ticket.itemName}${ticket.categoryName ? ` (${ticket.categoryName})` : ''}
📍 สถานที่: อาคารพจน์ สารสิน ${ticket.location.floor} ${ticket.location.roomOrArea}${ticket.location.specificDetail ? ' (' + ticket.location.specificDetail + ')' : ''}

ได้ดำเนินการซ่อมแซมและทดสอบเสร็จสิ้นเรียบร้อยแล้ว พร้อมให้ท่านใช้งานตามปกติ${techInfo}${notesInfo}

━━━━━━━━━━━━━━━━━━━━━━━━
⭐ กรุณาประเมินความพึงพอใจที่: https://building-repair-system.pages.dev/tracking/${ticket.id}
━━━━━━━━━━━━━━━━━━━━━━━━

ขอบคุณที่ใช้บริการ
สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
━━━━━━━━━━━━━━━━━━━━━━━━`,

    cancelled: `เรียน คุณ${ticket.reporter.name}

━━━━━━━━━━━━━━━━━━━━━━━━
❌ ยกเลิกคำร้อง
━━━━━━━━━━━━━━━━━━━━━━━━

รหัสคำร้อง: ${ticket.id}
รายการ: ${ticket.itemName}${ticket.categoryName ? ` (${ticket.categoryName})` : ''}
📍 สถานที่: อาคารพจน์ สารสิน ${ticket.location.floor} ${ticket.location.roomOrArea}

คำร้องนี้ถูกยกเลิก หากมีข้อสงสัยโปรดติดต่อ นายจักรินทร์ ศิลารัตน์ โทร 44843

━━━━━━━━━━━━━━━━━━━━━━━━
ข้อผิดพลาดโปรดแจ้ง: โทร 44843
สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
━━━━━━━━━━━━━━━━━━━━━━━━`,
  };

  return templates[status] || templates.in_progress;
}

export const STATUS_LABEL_TH: Record<TicketStatus, string> = {
  pending: 'รอรับเรื่อง',
  in_progress: 'อยู่ระหว่างดำเนินการ',
  waiting_parts: 'รออะไหล่/อุปกรณ์',
  completed: 'แล้วเสร็จ',
  cancelled: 'ยกเลิก',
};

// สถานะที่ต้องการแจ้งผู้ใช้งานโดยอัตโนมัติเมื่อมีการเปลี่ยนแปลง
export const AUTO_NOTIFY_STATUSES: TicketStatus[] = [
  'in_progress',
  'waiting_parts',
  'completed',
];
