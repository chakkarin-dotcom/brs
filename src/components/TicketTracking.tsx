import React, { useState } from 'react';
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  FileText,
  Building2,
  Tv,
  ShieldCheck,
  Droplet,
  Sparkles,
  Car,
  Image as ImageIcon,
  Award,
  Megaphone,
  DollarSign,
  ShieldAlert,
  Briefcase
} from 'lucide-react';
import { MaintenanceTicket, TicketStatus, ExecutiveRole, ExecutiveDirective } from '../types';
import { BUILDING_FLOORS } from '../data/locations';
import { SatisfactionRatingDisplay } from './SatisfactionRatingModal';

interface TicketTrackingProps {
  tickets: MaintenanceTicket[];
  selectedTicketId?: string;
  onSelectTicket: (ticketId: string) => void;
  onOpenNotifyModal: (ticket: MaintenanceTicket) => void;
  onOpenGoogleChatModal: (ticket: MaintenanceTicket) => void;
  onOpenRateModal?: (ticket: MaintenanceTicket) => void;
  onUpdateTicketStatus?: (ticketId: string, newStatus: TicketStatus, notes?: string) => void;
  isSuperAdmin: boolean;
  currentRole?: ExecutiveRole;
  onAddDirective?: (
    ticketId: string, 
    directive: Omit<ExecutiveDirective, 'id' | 'createdAt' | 'ticketId'>,
    notifyGoogleChat: boolean
  ) => void;
}

export const TicketTracking: React.FC<TicketTrackingProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onOpenNotifyModal,
  onOpenGoogleChatModal,
  onOpenRateModal,
  onUpdateTicketStatus,
  isSuperAdmin,
  currentRole,
  onAddDirective,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  
  // Executive quick directive state inside modal
  const [showDirectiveForm, setShowDirectiveForm] = useState(false);
  const [quickDirectiveType, setQuickDirectiveType] = useState<ExecutiveDirective['type']>('urgent_directive');
  const [quickDirectiveText, setQuickDirectiveText] = useState('');
  const [quickNotifyChat, setQuickNotifyChat] = useState(true);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || null;

  // Filter tickets
  const filteredTickets = tickets.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;
    const matchFloor = floorFilter === 'all' || t.location.floor.includes(floorFilter);
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      t.id.toLowerCase().includes(query) ||
      t.itemName.toLowerCase().includes(query) ||
      t.location.roomOrArea.toLowerCase().includes(query) ||
      t.reporter.name.toLowerCase().includes(query) ||
      t.reporter.phone.includes(query);

    return matchStatus && matchCategory && matchFloor && matchQuery;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            รอรับเรื่อง
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Wrench className="w-3 h-3 text-blue-600 animate-spin" />
            กำลังดำเนินการ
          </span>
        );
      case 'waiting_parts':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Clock className="w-3 h-3 text-purple-600" />
            รออะไหล่/อุปกรณ์
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            แล้วเสร็จ
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            ยกเลิก
          </span>
        );
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700">ด่วนที่สุด</span>;
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">ด่วน</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">ปกติ</span>;
    }
  };

  const calculateDuration = (created: string, completed?: string) => {
    if (!completed) return 'กำลังดำเนินการ';
    const diffMs = new Date(completed).getTime() - new Date(created).getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs > 24) {
      const days = Math.floor(diffHrs / 24);
      return `${days} วัน ${diffHrs % 24} ชม.`;
    }
    return `${diffHrs} ชม. ${diffMins} นาที`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              ติดตามสถานะการซ่อมบำรุง อาคารพจน์ สารสิน
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ตรวจสอบความคืบหน้า วันเวลาที่แจ้ง วันเวลาที่แล้วเสร็จ และช่างผู้รับผิดชอบ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              พบทั้งหมด <b className="text-red-700 font-mono text-sm">{filteredTickets.length}</b> รายการ
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาด้วยรหัสคำร้อง (เช่น REQ-202609-001), อุปกรณ์, ห้อง, หรือชื่อผู้แจ้ง..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอรับเรื่อง (Pending)</option>
              <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
              <option value="waiting_parts">รออะไหล่/อุปกรณ์</option>
              <option value="completed">แล้วเสร็จ (Completed)</option>
              <option value="cancelled">ยกเลิก</option>
            </select>
          </div>
        </div>

        {/* Status quick tabs */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            รอรับเรื่อง ({tickets.filter((t) => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'in_progress'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            กำลังดำเนินการ ({tickets.filter((t) => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            แล้วเสร็จ ({tickets.filter((t) => t.status === 'completed').length})
          </button>
        </div>

        {/* Floor quick filter tabs */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">ชั้น / โซน:</span>
          <button
            onClick={() => setFloorFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              floorFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทุกชั้น
          </button>
          {BUILDING_FLOORS.map((group) => {
            const count = tickets.filter((t) => t.location.floor.includes(group.floor)).length;
            const isActive = floorFilter === group.floor;
            return (
              <button
                key={group.floor}
                onClick={() => setFloorFilter(isActive ? 'all' : group.floor)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{group.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-base">ไม่พบข้อมูลคำร้องแจ้งซ่อม</h4>
            <p className="text-xs text-slate-500 mt-1">
              ลองเปลี่ยนคำค้นหา หรือตรวจสอบรหัสคำร้องอีกครั้ง
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-red-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors">
                    {ticket.id}
                  </span>
                  {getStatusBadge(ticket.status)}
                </div>

                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {getUrgencyBadge(ticket.urgency)}
                  <span className="text-[11px] text-slate-500 truncate">
                    {ticket.categoryName}
                  </span>
                  {ticket.executiveDirectives && ticket.executiveDirectives.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-full">
                      <Megaphone className="w-2.5 h-2.5 text-amber-600" />
                      คำสั่งการ ({ticket.executiveDirectives.length})
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-red-700 transition-colors">
                  {ticket.itemName}
                </h4>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="truncate">{ticket.location.floor} - {ticket.location.roomOrArea}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed bg-slate-50 p-2 rounded-xl">
                  {ticket.problemDescription}
                </p>

                {ticket.photos.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>แนบ {ticket.photos.length} รูปภาพ</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Dates & Reporter */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>
                    แจ้ง: {new Date(ticket.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="font-medium text-red-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>ดูรายละเอียด</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-base font-bold text-red-700">
                    {selectedTicket.id}
                  </span>
                  {getStatusBadge(selectedTicket.status)}
                  {getUrgencyBadge(selectedTicket.urgency)}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {selectedTicket.itemName} ({selectedTicket.categoryName})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>อาคารพจน์ สารสิน {selectedTicket.location.floor} - {selectedTicket.location.roomOrArea}</span>
                  {selectedTicket.location.specificDetail && (
                    <span className="text-slate-400">({selectedTicket.location.specificDetail})</span>
                  )}
                </p>
              </div>

              <button
                onClick={() => onSelectTicket('')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Requirement 2: Date & Time Tracking Timeline */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>ไทม์ไลน์และระยะเวลาดำเนินการ (Tracking)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">วันเวลาที่แจ้ง</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {new Date(selectedTicket.createdAt).toLocaleString('th-TH')} น.
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">วันเวลาที่แล้วเสร็จ</span>
                  <span className={`font-bold block mt-0.5 ${selectedTicket.completedAt ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {selectedTicket.completedAt
                      ? `${new Date(selectedTicket.completedAt).toLocaleString('th-TH')} น.`
                      : 'ยังไม่แล้วเสร็จ'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-semibold block">ระยะเวลาดำเนินการ</span>
                  <span className="font-bold text-red-700 block mt-0.5">
                    {calculateDuration(selectedTicket.createdAt, selectedTicket.completedAt)}
                  </span>
                </div>
              </div>

              {/* Technician Info */}
              {selectedTicket.assignedTechnician && (
                <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-700" />
                    <div>
                      <span className="text-[10px] text-blue-600 block">ช่างผู้รับผิดชอบ</span>
                      <span className="font-semibold text-blue-950">{selectedTicket.assignedTechnician.name}</span>
                    </div>
                  </div>
                  <a
                    href={`tel:${selectedTicket.assignedTechnician.phone}`}
                    className="inline-flex items-center gap-1 text-blue-700 font-semibold hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    <span>โทร {selectedTicket.assignedTechnician.phone}</span>
                  </a>
                </div>
              )}

              {selectedTicket.repairNotes && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                  <span className="font-semibold text-emerald-900 block mb-0.5">บันทึกผลการซ่อม:</span>
                  <p className="text-emerald-800 leading-relaxed">{selectedTicket.repairNotes}</p>
                </div>
              )}
            </div>

            {/* Photos Section */}
            {selectedTicket.photos.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-semibold text-slate-700 mb-2">ภาพถ่ายจุดชำรุด:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {selectedTicket.photos.map((img, idx) => (
                    <a
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-video rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity bg-slate-100"
                    >
                      <img src={img} alt="ภาพชำรุด" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Executive Directives & Comments Section */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-red-50/40 border border-amber-200/90 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200 mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-amber-700" />
                  <span className="font-bold text-slate-900 text-sm">
                    ข้อคิดเห็นและคำสั่งการของผู้บริหาร
                  </span>
                  {selectedTicket.executiveDirectives && selectedTicket.executiveDirectives.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-950">
                      {selectedTicket.executiveDirectives.length} รายการ
                    </span>
                  )}
                </div>

                {onAddDirective && (
                  <button
                    type="button"
                    onClick={() => setShowDirectiveForm(!showDirectiveForm)}
                    className="px-3 py-1 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors"
                  >
                    <Megaphone className="w-3 h-3" />
                    <span>{showDirectiveForm ? 'ปิดแบบฟอร์ม' : '+ สั่งการ / ให้ความเห็น'}</span>
                  </button>
                )}
              </div>

              {/* List of existing directives */}
              {selectedTicket.executiveDirectives && selectedTicket.executiveDirectives.length > 0 ? (
                <div className="space-y-2.5">
                  {selectedTicket.executiveDirectives.map((dir, idx) => (
                    <div 
                      key={dir.id || idx}
                      className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dir.role === 'director' ? 'bg-red-600' : 'bg-blue-600'}`} />
                          <span className="font-bold text-slate-900 text-[11px]">
                            {dir.authorPosition} ({dir.authorName})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(dir.createdAt).toLocaleString('th-TH')} น.
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          dir.type === 'urgent_directive'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : dir.type === 'budget_approval'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : dir.type === 'preventative_action'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {dir.type === 'urgent_directive' ? '⚡ คำสั่งการเร่งด่วน' :
                           dir.type === 'budget_approval' ? '💰 อนุมัติจัดซื้อ/งบประมาณ' :
                           dir.type === 'preventative_action' ? '🛡️ มาตรการป้องกัน' : '💬 ข้อคิดเห็นผู้บริหาร'}
                        </span>
                        {dir.notifiedGoogleChat && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            ✓ ส่ง Google Chat แล้ว
                          </span>
                        )}
                      </div>

                      <p className="text-slate-800 font-medium leading-relaxed bg-amber-50/50 p-2 rounded-lg border border-amber-100/60">
                        "{dir.content}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic py-1">
                  ยังไม่มีคำสั่งการหรือข้อคิดเห็นจากผู้อำนวยการ หรือรองผู้อำนวยการฝ่ายบริหารในคำร้องนี้
                </p>
              )}

              {/* Inline Directive Form */}
              {showDirectiveForm && onAddDirective && (
                <div className="mt-4 pt-3 border-t border-amber-200 bg-white p-3.5 rounded-xl border border-amber-300 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">
                      บันทึกข้อคิดเห็น / คำสั่งการของผู้บริหาร:
                    </span>
                    <span className="text-[10px] text-red-700 font-semibold">
                      (ผู้อำนวยการ / รองผู้อำนวยการฝ่ายบริหาร)
                    </span>
                  </div>

                  {/* Type buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuickDirectiveType('urgent_directive')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                        quickDirectiveType === 'urgent_directive'
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ⚡ สั่งการเร่งด่วน
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDirectiveType('budget_approval')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                        quickDirectiveType === 'budget_approval'
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      💰 อนุมัติงบ/อะไหล่
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDirectiveType('preventative_action')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                        quickDirectiveType === 'preventative_action'
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      🛡️ มาตรการป้องกัน
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDirectiveType('comment')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors ${
                        quickDirectiveType === 'comment'
                          ? 'bg-amber-700 text-white border-amber-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      💬 ข้อคิดเห็น
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    value={quickDirectiveText}
                    onChange={(e) => setQuickDirectiveText(e.target.value)}
                    placeholder="พิมพ์ข้อความสั่งการ หรือข้อคิดเห็นของผู้บริหาร..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={quickNotifyChat}
                        onChange={(e) => setQuickNotifyChat(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                      <span>ส่งแจ้งเตือนเข้า Google Chat ของทีมงาน</span>
                    </label>

                    <button
                      type="button"
                      disabled={!quickDirectiveText.trim()}
                      onClick={() => {
                        const isDir = currentRole === 'director';
                        onAddDirective(
                          selectedTicket.id,
                          {
                            role: isDir ? 'director' : 'deputy_director_admin',
                            authorName: isDir ? 'รศ.ดร.นรินทร์ ชมภูพวง' : 'รศ.ดร.นาฎนภา หีบแก้ว ปัดชาสุวรรณ์',
                            authorPosition: isDir ? 'ผู้อำนวยการสถาบันการสอนวิชาศึกษาทั่วไป' : 'รองผู้อำนวยการฝ่ายบริหาร',
                            type: quickDirectiveType,
                            content: quickDirectiveText.trim(),
                            urgencyFlag: quickDirectiveType === 'urgent_directive',
                            status: 'issued',
                          },
                          quickNotifyChat
                        );
                        setQuickDirectiveText('');
                        setShowDirectiveForm(false);
                      }}
                      className="px-4 py-1.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      <span>บันทึกคำสั่งการ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5W1H Summary Card (Requirement 5) */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                <span className="font-bold text-amber-400">📋 สรุปข้อมูล 5W1H ที่ส่ง Google Chat</span>
                <button
                  onClick={() => onOpenGoogleChatModal(selectedTicket)}
                  className="text-[11px] text-slate-300 hover:text-white underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>ดูการ์ด Google Chat</span>
                </button>
              </div>

              <div className="space-y-1.5 leading-relaxed">
                <div><b className="text-slate-400">WHO:</b> {selectedTicket.summary5W1H.who}</div>
                <div><b className="text-slate-400">WHAT:</b> {selectedTicket.summary5W1H.what}</div>
                <div><b className="text-slate-400">WHERE:</b> {selectedTicket.summary5W1H.where}</div>
                <div><b className="text-slate-400">WHEN:</b> {selectedTicket.summary5W1H.when}</div>
                <div><b className="text-slate-400">WHY:</b> {selectedTicket.summary5W1H.why}</div>
                <div><b className="text-slate-400">HOW:</b> {selectedTicket.summary5W1H.how}</div>
              </div>
            </div>

            {/* Reporter details and Requirement 3: Notification back to reporter */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">ข้อมูลผู้แจ้งเรื่อง</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedTicket.reporter.name}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-3">
                    <span>โทร: <b className="text-slate-800">{selectedTicket.reporter.phone}</b></span>
                    <span>อีเมล: <b className="text-slate-800">{selectedTicket.reporter.email}</b></span>
                    <span>ช่องทางที่เลือก: <b className="uppercase text-red-700">{selectedTicket.reporter.preferredNotifyChannel}</b></span>
                  </div>
                </div>

                {/* Requirement 3 Notification Trigger Button */}
                <button
                  type="button"
                  id="btn-notify-reporter"
                  onClick={() => onOpenNotifyModal(selectedTicket)}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>แจ้งกลับผู้แจ้ง (Notify)</span>
                </button>
              </div>

              {/* Notification history */}
              {selectedTicket.reporterNotifiedHistory && selectedTicket.reporterNotifiedHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700 block mb-1">ประวัติการแจ้งกลับ:</span>
                  <ul className="space-y-1">
                    {selectedTicket.reporterNotifiedHistory.map((h, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{new Date(h.timestamp).toLocaleTimeString('th-TH')}: {h.message} ({h.channel})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Satisfaction rating result */}
            {selectedTicket.satisfactionRating && (
              <div className="mt-4">
                <SatisfactionRatingDisplay rating={selectedTicket.satisfactionRating} />
              </div>
            )}

            {/* Admin quick actions if Super Admin is active */}
            {isSuperAdmin && onUpdateTicketStatus && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-2">⚡ การจัดการด่วน (Super Admin Quick Actions)</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onUpdateTicketStatus(selectedTicket.id, 'in_progress', 'รับเรื่องแล้ว กำลังส่งช่างเข้าตรวจสอบ')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                  >
                    ปรับเป็น "กำลังดำเนินการ"
                  </button>
                  <button
                    onClick={() => onUpdateTicketStatus(selectedTicket.id, 'waiting_parts', 'รอสั่งซื้ออะไหล่')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
                  >
                    ปรับเป็น "รออะไหล่"
                  </button>
                  <button
                    onClick={() => onUpdateTicketStatus(selectedTicket.id, 'completed', 'ดำเนินการซ่อมและทดสอบใช้งานเรียบร้อยแล้ว')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                  >
                    ปรับเป็น "แล้วเสร็จ"
                  </button>
                </div>
              </div>
            )}

            {/* Satisfaction rating open (Part 5) */}
            {onOpenRateModal && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-2">⭐ ประเมินความพึงพอใจ</span>
                <button
                  onClick={() => onOpenRateModal(selectedTicket)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs"
                >
                  {selectedTicket.satisfactionRating ? 'ประเมินซ้ำ / ดูคะแนนเดิม' : 'ให้คะแนน 5 ดาว'}
                </button>
                {selectedTicket.satisfactionRating && (
                  <p className="mt-2 text-[11px] text-amber-800">
                    เคยประเมินแล้วเมื่อ {new Date(selectedTicket.satisfactionRating.ratedAt).toLocaleString('th-TH')} น.
                  </p>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => onSelectTicket('')}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
