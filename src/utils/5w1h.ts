import { MaintenanceTicket, Summary5W1H } from '../types';

export function generate5W1H(params: {
  reporterName: string;
  reporterRole: string;
  reporterPhone: string;
  reporterDepartment?: string;
  categoryName: string;
  itemName: string;
  problemDescription: string;
  floor: string;
  roomOrArea: string;
  specificDetail?: string;
  urgency: string;
  createdAt?: string;
}): Summary5W1H {
  const dateStr = params.createdAt
    ? new Date(params.createdAt).toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  const roleText =
    params.reporterRole === 'faculty'
      ? 'อาจารย์/ผู้สอน'
      : params.reporterRole === 'staff'
      ? 'บุคลากร/เจ้าหน้าที่'
      : params.reporterRole === 'student'
      ? 'นักศึกษา มข.'
      : 'ผู้ใช้บริการทั่วไป';

  const deptText = params.reporterDepartment ? ` (${params.reporterDepartment})` : '';
  const who = `${params.reporterName} [${roleText}${deptText}] เบอร์ติดต่อ: ${params.reporterPhone}`;
  const what = `${params.itemName} (${params.categoryName}) - อาการ: ${params.problemDescription}`;
  const locationDetail = params.specificDetail ? ` (${params.specificDetail})` : '';
  const where = `อาคารพจน์ สารสิน ${params.floor} - ${params.roomOrArea}${locationDetail}`;
  const when = `${dateStr} น.`;

  let why = '';
  if (params.urgency === 'critical') {
    why = 'ส่งผลกระทบเร่งด่วนต่อการเรียนการสอน หรือมีความเสี่ยงด้านความปลอดภัย/ทรัพย์สิน จำเป็นต้องแก้ไขทันที';
  } else if (params.urgency === 'urgent') {
    why = 'ส่งผลกระทบต่อการใช้งานอาคารและการปฏิบัติงานของบุคลากร/นักศึกษา ควรเข้าดำเนินการโดยเร็ว';
  } else {
    why = 'เพื่อการบำรุงรักษาอาคารพจน์ สารสิน ให้อยู่ในสภาพสมบูรณ์และพร้อมให้บริการอย่างมีประสิทธิภาพ';
  }

  const how = `ส่งทีมช่างอาคาร/เจ้าหน้าที่ไอทีเข้าตรวจสอบจุดเกิดเหตุ ณ ${params.roomOrArea} พร้อมเตรียมเครื่องมือและอุปกรณ์อะไหล่สำหรับ ${params.itemName}`;

  return { who, what, where, when, why, how };
}

export function formatGoogleChatCard(ticket: MaintenanceTicket) {
  const urgencyLabel =
    ticket.urgency === 'critical'
      ? '🔴 ด่วนที่สุด (Critical)'
      : ticket.urgency === 'urgent'
      ? '🟡 ด่วน (Urgent)'
      : '🟢 ปกติ (Normal)';

  return {
    cardsV2: [
      {
        cardId: `ticket-${ticket.id}`,
        card: {
          header: {
            title: `🔔 แจ้งซ่อมอาคารพจน์ สารสิน: ${ticket.itemName}`,
            subtitle: `รหัสคำร้อง: ${ticket.id} | สถาบันการสอนวิชาศึกษาทั่วไป มข.`,
            imageUrl: 'https://cdn-icons-png.flaticon.com/512/1055/1055687.png',
            imageType: 'CIRCLE',
          },
          sections: [
            {
              header: '📋 สรุปข้อมูลตามหลัก 5W1H',
              collapsible: false,
              widgets: [
                {
                  decoratedText: {
                    topLabel: '👤 WHO (ใครแจ้ง)',
                    text: ticket.summary5W1H.who,
                    wrapText: true,
                  },
                },
                {
                  decoratedText: {
                    topLabel: '🛠️ WHAT (เกิดอะไรขึ้น)',
                    text: ticket.summary5W1H.what,
                    wrapText: true,
                  },
                },
                {
                  decoratedText: {
                    topLabel: '📍 WHERE (ที่ไหน)',
                    text: ticket.summary5W1H.where,
                    wrapText: true,
                  },
                },
                {
                  decoratedText: {
                    topLabel: '⏰ WHEN (เมื่อไหร่)',
                    text: ticket.summary5W1H.when,
                    wrapText: true,
                  },
                },
                {
                  decoratedText: {
                    topLabel: '⚠️ WHY (ทำไมต้องซ่อม/ผลกระทบ)',
                    text: ticket.summary5W1H.why,
                    wrapText: true,
                  },
                },
                {
                  decoratedText: {
                    topLabel: '🔧 HOW (จะแก้ไขอย่างไร)',
                    text: ticket.summary5W1H.how,
                    wrapText: true,
                  },
                },
              ],
            },
            {
              header: '📨 รายชื่อผู้รับแจ้งทาง Google Chat',
              widgets: [
                {
                  decoratedText: {
                    topLabel: 'เจ้าหน้าที่ผู้รับผิดชอบ',
                    text: '<b>นายจักรินทร์ ศิลารัตน์</b> (chakkarin@kku.ac.th)',
                    bottomLabel: 'นักเทคโนโลยีสารสนเทศ ชำนาญการ',
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'สำเนาเรียนเพื่อรับทราบ',
                    text: '<b>หัวหน้างานบริหาร</b> (sutako@kku.ac.th)',
                    bottomLabel: 'สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น',
                  },
                },
                {
                  decoratedText: {
                    topLabel: 'ระดับความเร่งด่วน',
                    text: urgencyLabel,
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
}

export function formatGoogleChatMarkdown(ticket: MaintenanceTicket): string {
  const urgencyLabel =
    ticket.urgency === 'critical' ? '🔴 ด่วนที่สุด' : ticket.urgency === 'urgent' ? '🟡 ด่วน' : '🟢 ปกติ';

  return `🔔 *[แจ้งซ่อมอาคารพจน์ สารสิน มข.]* รหัส: *${ticket.id}*
📌 *รายการ:* ${ticket.itemName} (${ticket.categoryName})
⚡ *ความเร่งด่วน:* ${urgencyLabel}

━━━━━━━━━━━━━━━━━━━━━
📋 *สรุปสาระสำคัญ (5W1H)*
• *WHO (ใคร):* ${ticket.summary5W1H.who}
• *WHAT (อะไร):* ${ticket.summary5W1H.what}
• *WHERE (ที่ไหน):* ${ticket.summary5W1H.where}
• *WHEN (เมื่อไหร่):* ${ticket.summary5W1H.when}
• *WHY (ทำไม):* ${ticket.summary5W1H.why}
• *HOW (อย่างไร):* ${ticket.summary5W1H.how}
━━━━━━━━━━━━━━━━━━━━━
👥 *ส่งแจ้งเตือนถึง:*
1. คุณจักรินทร์ ศิลารัตน์ (chakkarin@kku.ac.th) - เจ้าหน้าที่ผู้รับผิดชอบ
2. หัวหน้างานบริหาร (sutako@kku.ac.th) - สำเนาเพื่อทราบ`;
}
