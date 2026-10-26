export interface FloorLocationGroup {
  floor: string;
  floorBadge: string;
  label: string;
  rooms: string[];
}

export const BUILDING_FLOORS: FloorLocationGroup[] = [
  {
    floor: 'ชั้น 1',
    floorBadge: '1F',
    label: 'ห้องเรียนชั้น 1',
    rooms: [
      'ห้อง GL101',
      'ห้อง GL104',
      'ห้อง GL109',
      'ห้อง GL135',
      'ห้องควบคุมไฟฟ้า',
      'ห้องน้ำบุคลากรชาย',
      'ห้องน้ำบุคลากรหญิง',
    ],
  },
  {
    floor: 'ชั้น 2',
    floorBadge: '2F',
    label: 'ชั้น 2',
    rooms: [
      'ห้อง GL212',
      'ห้อง GL213',
      'ห้อง GL214',
      'ห้อง GL215',
      'ห้อง GL216',
      'ห้อง GL217',
      'ห้อง GL218',
      'ห้อง GL219',
      'ห้อง GL233',
      'ห้องน้ำนักศึกษาชาย',
      'ห้องน้ำนักศึกษาหญิง',
    ],
  },
  {
    floor: 'ชั้น 3',
    floorBadge: '3F',
    label: 'ชั้น 3',
    rooms: [
      'ห้อง GL312',
      'ห้อง GL313',
      'ห้อง GL314',
      'ห้อง GL315',
      'ห้องประชุม GL336',
      'ห้อง GL301',
      'ห้อง GL310',
      'ห้องประชุมกระจก',
      'ห้องน้ำบุคลากรชาย',
      'ห้องน้ำบุคลากรหญิง',
      'ห้องน้ำนักศึกษาชาย',
      'ห้องน้ำนักศึกษาหญิง',
    ],
  },
  {
    floor: 'ชั้น 4',
    floorBadge: '4F',
    label: 'ชั้น 4',
    rooms: [
      'ห้องควบคุมลิฟท์',
      'ห้องเก็บของ',
    ],
  },
  {
    floor: 'ลานจอดรถ',
    floorBadge: 'PARK',
    label: 'ลานจอดรถ',
    rooms: [
      'ลานจอดรถยนต์ P1',
      'ลานจอดรถยนต์ P2',
      'ลานจอดรถยนต์ P3',
      'ลานจอดรถจักรยานยนต์ P4',
      'ลานจอดรถจักรยานยนต์ P5',
    ],
  },
  {
    floor: 'ภายนอกอาคาร',
    floorBadge: 'EXT',
    label: 'ภายนอกอาคาร / ทางเข้า',
    rooms: [
      'ถนนเส้นใหม่ทางเข้าลานจอดรถยนต์ P3',
      'โถงทางเข้าหลักอาคารพจน์ สารสิน',
      'ทางเดินรอบอาคาร',
    ],
  },
  {
    floor: 'ดาดฟ้า',
    floorBadge: 'ROOF',
    label: 'ดาดฟ้า / แทงค์น้ำ',
    rooms: [
      'ดาดฟ้า / จุดติดตั้งแทงค์น้ำ',
    ],
  },
];

// Helper to look up floor by room name
export function findFloorByRoom(room: string): string | null {
  for (const group of BUILDING_FLOORS) {
    if (group.rooms.includes(room)) {
      return group.floor;
    }
  }
  return null;
}

// Flat list of all rooms
export const ALL_ROOM_SUGGESTIONS: string[] = BUILDING_FLOORS.flatMap((g) => g.rooms);
