export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

export type TicketStatus = 
  | 'pending'       // รอรับเรื่อง
  | 'in_progress'   // กำลังดำเนินการ
  | 'waiting_parts' // รออะไหล่/อุปกรณ์
  | 'completed'     // แล้วเสร็จ
  | 'cancelled';    // ยกเลิก/ไม่อยู่ในเงื่อนไข

export type ExecutiveRole = 'director' | 'deputy_director_admin' | 'staff' | 'super_admin';

export interface ExecutiveDirective {
  id: string;
  ticketId: string;
  role: 'director' | 'deputy_director_admin';
  authorName: string;
  authorPosition: string; // เช่น 'ผู้อำนวยการสถาบันการสอนวิชาศึกษาทั่วไป', 'รองผู้อำนวยการฝ่ายบริหาร'
  content: string;
  type: 'urgent_directive' | 'budget_approval' | 'preventative_action' | 'comment' | 'assign_task';
  urgencyFlag?: boolean;
  createdAt: string;
  status?: 'issued' | 'acknowledged' | 'in_progress' | 'completed';
  responseNote?: string;
  notifiedGoogleChat?: boolean;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  iconName?: string;
}

export interface MaintenanceCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
  color: string;
  items: CategoryItem[];
}

export interface Summary5W1H {
  who: string;      // ใครแจ้ง (ชื่อ, หน่วยงาน/ตำแหน่ง, ช่องทางติดต่อ)
  what: string;     // เกิดอะไรขึ้น (อุปกรณ์ที่ชำรุด อาการเสีย)
  where: string;    // ที่ไหน (จุดเกิดเหตุ/ห้อง/ชั้น อาคารพจน์ สารสิน)
  when: string;     // เมื่อไหร่ (วันเวลาที่เกิดเหตุ/ที่แจ้ง)
  why: string;      // ทำไมต้องซ่อม (สาเหตุ/ผลกระทบต่อการเรียนการสอน/ความปลอดภัย)
  how: string;      // อย่างไร (แนวทางการแก้ไข/เครื่องมือ/อะไหล่ที่ต้องใช้)
}

export interface GoogleChatDispatch {
  sentAt: string;
  primaryRecipient: string; // chakkarin@kku.ac.th
  ccRecipient: string;      // sutako@kku.ac.th
  status: 'sent' | 'pending' | 'failed';
  webhookResponse?: string;
  cardPayload?: any;
}

export interface MaintenanceTicket {
  id: string;                      // เช่น REQ-202609-001
  createdAt: string;               // ISO string
  updatedAt: string;
  completedAt?: string;            // วันเวลาที่แล้วเสร็จ
  categoryId: string;
  categoryName: string;
  itemId: string;
  itemName: string;
  customItemName?: string;
  location: {
    floor: string;                 // ชั้น 1 - 5, ลานจอดรถ, นอกอาคาร
    roomOrArea: string;            // เช่น ห้อง GL101, ลานจอดรถ P1
    specificDetail?: string;       // จุดอ้างอิง
  };
  urgency: UrgencyLevel;
  problemDescription: string;
  photos: string[];                // Base64 or image URLs
  completionPhotos?: string[];     // ภาพถ่ายหลังซ่อมเสร็จ
  
  // ผู้แจ้ง
  reporter: {
    name: string;
    role: 'faculty' | 'staff' | 'student' | 'external' | 'other';
    department?: string;
    phone: string;
    email?: string;
    lineId?: string;
    preferredNotifyChannel: 'email' | 'phone' | 'line' | 'sms';
  };

  // สถานะและการซ่อม
  status: TicketStatus;
  assignedTechnician?: {
    name: string;
    phone: string;
    assignedAt: string;
  };
  repairNotes?: string;
  estimatedCost?: number;
  
  // 5W1H สรุปผล
  summary5W1H: Summary5W1H;
  
  // ประวัติการแจ้งเตือน Google Chat
  googleChatDispatch?: GoogleChatDispatch;
  
  // ประวัติการแจ้งกลับผู้แจ้ง
  reporterNotifiedHistory?: Array<{
    timestamp: string;
    channel: string;
    message: string;
    status: string;
  }>;

  // ข้อคิดเห็นและคำสั่งการของผู้บริหาร (ผู้อำนวยการ / รองผู้อำนวยการฝ่ายบริหาร)
  executiveDirectives?: ExecutiveDirective[];

  // แบบประเมินความพึงพอใจของผู้แจ้ง (หลังงานแล้วเสร็จ)
  satisfactionRating?: SatisfactionRating;
}

// แบบประเมินความพึงพอใจ 5 ดาว โดยผู้ใช้บริการ (ผู้แจ้งซ่อม)
export interface SatisfactionRating {
  speed: number;      // ความรวดเร็วในการดำเนินการ (1-5)
  quality: number;    // คุณภาพการซ่อม (1-5)
  equipment: number;  // ความพร้อมของเครื่องมือ/อุปกรณ์ (1-5)
  overall: number;    // ความพึงพอใจโดยรวม (1-5)
  comment?: string;   // ความคิดเห็น/ข้อเสนอแนะเพิ่มเติม
  ratedAt: string;    // วันเวลาที่ประเมิน (ISO string)
}

export interface SystemRating {
  overall: number;     // คะแนนความพึงพอใจภาพรวมระบบ (1-5)
  comment?: string;    // ข้อเสนอแนะเพิ่มเติม
  ratedAt: string;     // วันเวลาที่ประเมิน
}

export interface OfficerProfile {
  name: string;
  position: string;
  organization: string;
  internalPhone: string;
  mobilePhone: string;
  email: string;
  photoUrl: string;
  availabilityStatus: 'on_duty' | 'busy' | 'away';
  workHours: string;
}

export interface DashboardTimeframeFilter {
  period: '1m' | '3m' | '6m' | '12m' | 'all';
  label: string;
}
