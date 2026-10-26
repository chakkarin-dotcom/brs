import * as XLSX from 'xlsx';
import { MaintenanceTicket } from '../types';

export function exportTicketsToExcel(tickets: MaintenanceTicket[], filenamePrefix = 'รายงานแจ้งซ่อม_อาคารพจน์สารสิน_มข') {
  const rows = tickets.map((t, index) => {
    const createdDate = new Date(t.createdAt).toLocaleString('th-TH');
    const completedDate = t.completedAt ? new Date(t.completedAt).toLocaleString('th-TH') : '-';

    let durationText = '-';
    if (t.completedAt) {
      const diffMs = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (diffHrs > 24) {
        const days = Math.floor(diffHrs / 24);
        durationText = `${days} วัน ${diffHrs % 24} ชม.`;
      } else {
        durationText = `${diffHrs} ชม. ${diffMins} นาที`;
      }
    }

    const statusMap: Record<string, string> = {
      pending: 'รอรับเรื่อง',
      in_progress: 'กำลังดำเนินการ',
      waiting_parts: 'รออะไหล่/อุปกรณ์',
      completed: 'แล้วเสร็จ',
      cancelled: 'ยกเลิก',
    };

    const urgencyMap: Record<string, string> = {
      normal: 'ปกติ',
      urgent: 'ด่วน',
      critical: 'ด่วนที่สุด',
    };

    return {
      'ลำดับ': index + 1,
      'รหัสคำร้อง': t.id,
      'วันเวลาที่แจ้ง': createdDate,
      'วันเวลาที่แล้วเสร็จ': completedDate,
      'ระยะเวลาดำเนินการ': durationText,
      'สถานะ': statusMap[t.status] || t.status,
      'ระดับความเร่งด่วน': urgencyMap[t.urgency] || t.urgency,
      'หมวดหมู่ระบบ': t.categoryName,
      'รายการอุปกรณ์/จุดชำรุด': t.itemName,
      'ชั้น/พื้นที่': t.location.floor,
      'ห้อง/จุดเกิดเหตุ': t.location.roomOrArea,
      'รายละเอียดจุดสังเกต': t.location.specificDetail || '-',
      'รายละเอียดอาการชำรุด': t.problemDescription,
      'ชื่อผู้แจ้ง': t.reporter.name,
      'เบอร์โทรศัพท์ผู้แจ้ง': t.reporter.phone,
      'อีเมลผู้แจ้ง': t.reporter.email,
      'ช่องทางรับแจ้งผล': t.reporter.preferredNotifyChannel.toUpperCase(),
      'ช่าง/เจ้าหน้าที่ผู้รับผิดชอบ': t.assignedTechnician?.name || '-',
      'เบอร์โทรช่าง': t.assignedTechnician?.phone || '-',
      'บันทึกการซ่อม': t.repairNotes || '-',
      'สรุป 5W1H (WHO)': t.summary5W1H.who,
      'สรุป 5W1H (WHAT)': t.summary5W1H.what,
      'สรุป 5W1H (WHERE)': t.summary5W1H.where,
      'สรุป 5W1H (WHEN)': t.summary5W1H.when,
      'สรุป 5W1H (WHY)': t.summary5W1H.why,
      'สรุป 5W1H (HOW)': t.summary5W1H.how,
      'การแจ้งเตือน Google Chat': t.googleChatDispatch?.status === 'sent' ? 'ส่งแล้ว (chakkarin / sutako)' : 'ยังไม่ส่ง',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths for readability
  const colWidths = [
    { wch: 6 },  // ลำดับ
    { wch: 16 }, // รหัสคำร้อง
    { wch: 22 }, // วันเวลาที่แจ้ง
    { wch: 22 }, // วันเวลาที่แล้วเสร็จ
    { wch: 18 }, // ระยะเวลา
    { wch: 16 }, // สถานะ
    { wch: 14 }, // เร่งด่วน
    { wch: 26 }, // หมวดหมู่
    { wch: 24 }, // รายการ
    { wch: 14 }, // ชั้น
    { wch: 26 }, // ห้อง
    { wch: 22 }, // รายละเอียด
    { wch: 35 }, // อาการ
    { wch: 22 }, // ผู้แจ้ง
    { wch: 16 }, // โทร
    { wch: 24 }, // อีเมล
    { wch: 14 }, // ช่องทาง
    { wch: 26 }, // ช่าง
    { wch: 16 }, // โทรช่าง
    { wch: 35 }, // บันทึก
    { wch: 35 }, // WHO
    { wch: 35 }, // WHAT
    { wch: 35 }, // WHERE
    { wch: 22 }, // WHEN
    { wch: 35 }, // WHY
    { wch: 35 }, // HOW
    { wch: 30 }, // Google Chat
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการแจ้งซ่อม');

  // Format date stamp for filename
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const fullFilename = `${filenamePrefix}_${dateStr}.xlsx`;

  XLSX.writeFile(workbook, fullFilename);
}
