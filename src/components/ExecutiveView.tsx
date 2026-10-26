import React, { useState } from 'react';
import { 
  Award, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  FileText, 
  MessageSquare, 
  ShieldAlert, 
  DollarSign, 
  Sparkles, 
  ChevronRight, 
  Filter, 
  UserCheck, 
  Printer, 
  ArrowUpRight, 
  MapPin, 
  Search,
  CheckCircle,
  Eye,
  Megaphone,
  Briefcase
} from 'lucide-react';
import { MaintenanceTicket, ExecutiveDirective, ExecutiveRole, TicketStatus } from '../types';

interface ExecutiveViewProps {
  tickets: MaintenanceTicket[];
  currentRole: ExecutiveRole;
  setCurrentRole: (role: ExecutiveRole) => void;
  onAddDirective: (
    ticketId: string, 
    directive: Omit<ExecutiveDirective, 'id' | 'createdAt' | 'ticketId'>,
    notifyGoogleChat: boolean
  ) => void;
  onSelectTicket?: (ticketId: string) => void;
  onOpenGoogleChatModal?: (ticket: MaintenanceTicket) => void;
}

export const ExecutiveView: React.FC<ExecutiveViewProps> = ({
  tickets,
  currentRole,
  setCurrentRole,
  onAddDirective,
  onSelectTicket,
  onOpenGoogleChatModal,
}) => {
  const [selectedTicketForDirective, setSelectedTicketForDirective] = useState<MaintenanceTicket | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'needs_action' | 'with_directives' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Directive Form state
  const [directiveType, setDirectiveType] = useState<ExecutiveDirective['type']>('urgent_directive');
  const [directiveContent, setDirectiveContent] = useState('');
  const [notifyChat, setNotifyChat] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Executive Profiles
  const executiveProfiles = {
    director: {
      title: 'ผู้อำนวยการ',
      name: 'รศ.ดร.นรินทร์ ชมภูพวง',
      role: 'director' as ExecutiveRole,
      position: 'ผู้อำนวยการสถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น',
      badgeBg: 'bg-red-900 text-amber-100 border-red-700',
      avatarColor: 'from-red-800 to-amber-700',
    },
    deputy_director_admin: {
      title: 'รองผู้อำนวยการฝ่ายบริหาร',
      name: 'รศ.ดร.นาฎนภา หีบแก้ว ปัดชาสุวรรณ์',
      role: 'deputy_director_admin' as ExecutiveRole,
      position: 'รองผู้อำนวยการฝ่ายบริหาร สถาบันการสอนวิชาศึกษาทั่วไป',
      badgeBg: 'bg-slate-900 text-blue-100 border-slate-700',
      avatarColor: 'from-slate-800 to-blue-700',
    }
  };

  const activeProfile = currentRole === 'director' 
    ? executiveProfiles.director 
    : executiveProfiles.deputy_director_admin;

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      t.id.toLowerCase().includes(q) ||
      t.itemName.toLowerCase().includes(q) ||
      t.location.roomOrArea.toLowerCase().includes(q) ||
      t.reporter.name.toLowerCase().includes(q);

    if (!matchQuery) return false;

    if (activeFilterTab === 'needs_action') {
      return (t.urgency === 'critical' || t.status === 'pending' || t.status === 'waiting_parts') && (!t.executiveDirectives || t.executiveDirectives.length === 0);
    }
    if (activeFilterTab === 'with_directives') {
      return t.executiveDirectives && t.executiveDirectives.length > 0;
    }
    if (activeFilterTab === 'completed') {
      return t.status === 'completed';
    }
    return true;
  });

  // Calculate executive KPI metrics
  const totalTickets = tickets.length;
  const criticalCount = tickets.filter(t => t.urgency === 'critical').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;
  const pendingCount = tickets.filter(t => t.status === 'pending').length;
  
  // Total directives issued across all tickets
  const allDirectives: Array<ExecutiveDirective & { ticket: MaintenanceTicket }> = [];
  tickets.forEach(t => {
    if (t.executiveDirectives) {
      t.executiveDirectives.forEach(d => {
        allDirectives.push({ ...d, ticket: t });
      });
    }
  });
  allDirectives.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Building Readiness Rate (approx calculation based on active issues vs total rooms/infrastructure)
  const readinessRate = Math.min(100, Math.max(80, Math.round(((totalTickets - (criticalCount * 2 + pendingCount)) / (totalTickets || 1)) * 100)));

  // Quick preset templates for executive directives
  const presetTemplates = [
    {
      type: 'urgent_directive' as const,
      label: '⚡ สั่งการเร่งด่วน',
      text: 'สั่งการเร่งด่วน: ให้เข้าดำเนินการตรวจสอบและแก้ไขให้แล้วเสร็จภายใน 3 ชั่วโมง เพื่อไม่ให้กระทบต่อการเรียนการสอนรายวิชาศึกษาทั่วไป และรายงานผลทันทีที่เสร็จสิ้น',
    },
    {
      type: 'budget_approval' as const,
      label: '💰 อนุมัติจัดซื้อ/งบประมาณ',
      text: 'อนุมัติ: ให้จัดซื้ออะไหล่/อุปกรณ์ทดแทนตามระเบียบพัสดุเร่งด่วน และสำรองไว้อย่างน้อย 1 ชุด เพื่อความพร้อมใช้งานต่อเนื่อง',
    },
    {
      type: 'preventative_action' as const,
      label: '🛡️ มาตรการป้องกันเชิงรุก',
      text: 'สั่งการมาตรการป้องกัน: ขอให้ทีมงานจัดทำแผนบำรุงรักษาเชิงป้องกัน (Preventative Maintenance) ตรวจสอบอุปกรณ์ประเภทนี้ทุกจุดในอาคารพจน์ สารสิน ในวันหยุดสุดสัปดาห์นี้',
    },
    {
      type: 'comment' as const,
      label: '💬 ข้อคิดเห็น/คำชื่นชม',
      text: 'รับทราบรายงาน ขอบคุณทีมงานที่ดำเนินการดูแลอาคารอย่างรวดเร็ว ขอให้ประสานงานอาจารย์ผู้สอนหรือผู้แจ้งเพื่อทดสอบการใช้งานจริง',
    },
    {
      type: 'assign_task' as const,
      label: '👥 มอบหมายงานเฉพาะกิจ',
      text: 'มอบหมาย: ให้ทีมช่างอาคารร่วมกับเจ้าหน้าที่ไอทีบูรณาการตรวจสอบจุดนี้ร่วมกัน และส่งรายงานสรุปให้ฝ่ายบริหารทราบ',
    },
  ];

  const handleOpenDirectiveModal = (ticket: MaintenanceTicket) => {
    setSelectedTicketForDirective(ticket);
    setDirectiveType('urgent_directive');
    setDirectiveContent('');
    setNotifyChat(true);
  };

  const handleSubmitDirective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForDirective || !directiveContent.trim()) return;

    setSubmitting(true);
    
    // Call parent handler
    onAddDirective(
      selectedTicketForDirective.id,
      {
        role: activeProfile.role as 'director' | 'deputy_director_admin',
        authorName: activeProfile.name,
        authorPosition: activeProfile.position,
        type: directiveType,
        content: directiveContent.trim(),
        urgencyFlag: directiveType === 'urgent_directive',
        status: 'issued',
      },
      notifyChat
    );

    setTimeout(() => {
      setSubmitting(false);
      setSuccessToast(`บันทึกคำสั่งการของ ${activeProfile.title} และแจ้งเตือนแล้วเรียบร้อย`);
      setSelectedTicketForDirective(null);
      setTimeout(() => setSuccessToast(null), 4000);
    }, 400);
  };

  const getDirectiveBadge = (type: ExecutiveDirective['type']) => {
    switch (type) {
      case 'urgent_directive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            คำสั่งการเร่งด่วน
          </span>
        );
      case 'budget_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            อนุมัติจัดซื้อ/งบประมาณ
          </span>
        );
      case 'preventative_action':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <ShieldAlert className="w-3 h-3 text-blue-600" />
            มาตรการป้องกันเชิงรุก
          </span>
        );
      case 'assign_task':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Briefcase className="w-3 h-3 text-purple-600" />
            มอบหมายงานเฉพาะกิจ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <MessageSquare className="w-3 h-3 text-amber-600" />
            ข้อคิดเห็นผู้บริหาร
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-emerald-500 flex items-center gap-3 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-medium">{successToast}</span>
        </div>
      )}

      {/* Official Executive Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-red-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                EXECUTIVE DASHBOARD & DIRECTIVES PORTAL
              </span>
              <span className="text-xs text-slate-300">
                สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              มุมมองผู้บริหาร สรุปและสั่งการ อาคารพจน์ สารสิน
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ติดตามภาพรวมการบริหารจัดการอาคาร ผลกระทบต่อการเรียนการสอน และสามารถออกคำสั่งการหรือให้ข้อคิดเห็นโดยตรงถึงทีมช่างและเจ้าหน้าที่ผู้รับผิดชอบ
            </p>
          </div>

          {/* Role Switcher Pill */}
          <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex flex-col gap-2 shrink-0">
            <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              <span>เลือกบทบาทผู้บริหาร (Current Executive Role):</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Director button */}
              <button
                type="button"
                id="role-switch-director"
                onClick={() => setCurrentRole('director')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 ${
                  currentRole === 'director'
                    ? 'bg-red-700 text-white shadow-md ring-2 ring-amber-400/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <div>
                  <div className="font-bold">ผู้อำนวยการ</div>
                  <div className="text-[10px] opacity-80 truncate max-w-[120px]">
                    รศ.ดร.นรินทร์
                  </div>
                </div>
              </button>

              {/* Deputy Director button */}
              <button
                type="button"
                id="role-switch-deputy"
                onClick={() => setCurrentRole('deputy_director_admin')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 ${
                  currentRole === 'deputy_director_admin'
                    ? 'bg-blue-700 text-white shadow-md ring-2 ring-amber-400/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                <div>
                  <div className="font-bold">รอง ผอ. ฝ่ายบริหาร</div>
                  <div className="text-[10px] opacity-80 truncate max-w-[120px]">
                    รศ.ดร.นาฎนภา
                  </div>
                </div>
              </button>
            </div>

            {/* Active profile label */}
            <div className="text-[10px] text-slate-300 pt-1 border-t border-white/10 flex items-center justify-between">
              <span>กำลังใช้งานในฐานะ:</span>
              <span className="font-bold text-amber-300">{activeProfile.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Key Indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Building Readiness */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ความพร้อมใช้อาคาร</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {readinessRate}%
              </span>
              <span className="text-xs font-medium text-emerald-600">พร้อมใช้งานสูง</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              อาคารพจน์ สารสิน & ห้องเรียน GE
            </p>
          </div>
        </div>

        {/* KPI 2: Critical / Needs Executive Attention */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ปัญหาด่วน/รอคำสั่งการ</span>
            <span className="p-2 rounded-xl bg-red-50 text-red-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-red-600 font-mono">
                {criticalCount}
              </span>
              <span className="text-xs font-medium text-red-600">รายการวิกฤต</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ต้องการการตัดสินใจหรือสั่งการ
            </p>
          </div>
        </div>

        {/* KPI 3: Total Directives Issued */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">คำสั่งการผู้บริหารสะสม</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Megaphone className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {allDirectives.length}
              </span>
              <span className="text-xs font-medium text-amber-700">คำสั่งการ/ข้อคิดเห็น</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              บันทึกและส่งผ่าน Google Chat
            </p>
          </div>
        </div>

        {/* KPI 4: In Progress vs Completed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">สถานะงานซ่อม</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">
                {inProgressCount}
              </span>
              <span className="text-xs text-slate-500">/ แล้วเสร็จ {completedCount} งาน</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              จากคำร้องทั้งหมด {totalTickets} รายการ
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area: Tickets & Directive Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets to inspect & issue directives (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-700" />
                  <span>รายการคำร้องซ่อมบำรุงสำหรับผู้บริหารพิจารณาสั่งการ</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  คลิกที่รายการเพื่อดูรายละเอียด 5W1H หรือออกคำสั่งการ/ให้ข้อคิดเห็น
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                  title="พิมพ์สรุปรายงานผู้บริหาร"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">พิมพ์รายงาน</span>
                </button>
              </div>
            </div>

            {/* Search & Tabs */}
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาด้วยรหัสคำร้อง, อุปกรณ์, ห้อง, หรือชื่อผู้แจ้ง..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveFilterTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeFilterTab === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  คำร้องทั้งหมด ({tickets.length})
                </button>
                <button
                  onClick={() => setActiveFilterTab('needs_action')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeFilterTab === 'needs_action'
                      ? 'bg-red-700 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  ⚡ ด่วน/รอสั่งการ ({tickets.filter(t => (t.urgency === 'critical' || t.status === 'pending' || t.status === 'waiting_parts') && (!t.executiveDirectives || t.executiveDirectives.length === 0)).length})
                </button>
                <button
                  onClick={() => setActiveFilterTab('with_directives')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeFilterTab === 'with_directives'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  📋 มีคำสั่งการแล้ว ({tickets.filter(t => t.executiveDirectives && t.executiveDirectives.length > 0).length})
                </button>
                <button
                  onClick={() => setActiveFilterTab('completed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    activeFilterTab === 'completed'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  ✓ แล้วเสร็จ ({completedCount})
                </button>
              </div>
            </div>

            {/* Tickets Table / List */}
            <div className="mt-5 space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">ไม่พบรายการที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                filteredTickets.map(ticket => {
                  const hasDirectives = ticket.executiveDirectives && ticket.executiveDirectives.length > 0;
                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-red-300 bg-white hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {ticket.id}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            ticket.urgency === 'critical' 
                              ? 'bg-red-100 text-red-700' 
                              : ticket.urgency === 'urgent' 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.urgency === 'critical' ? 'ด่วนที่สุด' : ticket.urgency === 'urgent' ? 'ด่วน' : 'ปกติ'}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate">
                            {ticket.categoryName}
                          </span>
                          {hasDirectives && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Megaphone className="w-3 h-3 text-amber-600" />
                              มี {ticket.executiveDirectives!.length} คำสั่งการ
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-slate-900 text-sm truncate">
                          {ticket.itemName}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3 text-red-500" />
                            {ticket.location.floor} - {ticket.location.roomOrArea}
                          </span>
                          <span>ผู้แจ้ง: <b className="text-slate-700">{ticket.reporter.name}</b></span>
                          <span>แจ้งเมื่อ: {new Date(ticket.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                        </div>

                        {/* Recent directive quote if any */}
                        {hasDirectives && (
                          <div className="mt-1.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
                            <Megaphone className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <div className="line-clamp-2">
                              <span className="font-bold">{ticket.executiveDirectives![ticket.executiveDirectives!.length - 1].authorPosition}: </span>
                              "{ticket.executiveDirectives![ticket.executiveDirectives!.length - 1].content}"
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {onSelectTicket && (
                          <button
                            type="button"
                            onClick={() => onSelectTicket(ticket.id)}
                            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium flex items-center gap-1"
                            title="ดูรายละเอียดฉบับเต็ม"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">ดูข้อมูล</span>
                          </button>
                        )}

                        <button
                          type="button"
                          id={`btn-issue-directive-${ticket.id}`}
                          onClick={() => handleOpenDirectiveModal(ticket)}
                          className="px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Megaphone className="w-3.5 h-3.5" />
                          <span>ออกคำสั่งการ / ข้อคิดเห็น</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Directives Log & Executive Intelligence (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Directive History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>ประวัติคำสั่งการของผู้บริหารล่าสุด</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {allDirectives.length} รายการ
              </span>
            </div>

            <div className="mt-3 space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {allDirectives.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  ยังไม่มีคำสั่งการที่บันทึก
                </div>
              ) : (
                allDirectives.map((dir) => (
                  <div 
                    key={dir.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-300 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${dir.role === 'director' ? 'bg-red-600' : 'bg-blue-600'}`} />
                        <span>{dir.authorPosition}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(dir.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getDirectiveBadge(dir.type)}
                      <span className="font-mono text-[10px] text-slate-500 font-semibold">
                        {dir.ticket.id}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed bg-white p-2 rounded-xl border border-slate-100 font-medium">
                      "{dir.content}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="truncate">{dir.ticket.itemName} ({dir.ticket.location.roomOrArea})</span>
                      {onSelectTicket && (
                        <button
                          type="button"
                          onClick={() => onSelectTicket(dir.ticket.id)}
                          className="text-red-700 font-semibold hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          <span>ดูงาน</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Contact & Escalation Box */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xs">
            <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>สายด่วนฝ่ายบริหารอาคารพจน์ สารสิน</span>
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              กรณีเกิดเหตุฉุกเฉินต้องการสั่งการเร่งด่วนทางโทรศัพท์
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">โทรภายใน (อาคารพจน์ สารสิน)</span>
                  <span className="font-bold text-amber-300 text-sm">44843</span>
                </div>
                <a href="tel:44843" className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                  โทร
                </a>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">สายด่วนหัวหน้างานไอที/อาคาร</span>
                  <span className="font-bold text-amber-300 text-sm">089-9419494</span>
                </div>
                <a href="tel:0899419494" className="px-3 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                  โทร
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directive Modal for Issuing Orders/Comments */}
      {selectedTicketForDirective && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                    แบบฟอร์มคำสั่งการผู้บริหาร
                  </span>
                  <span className="font-mono text-xs text-slate-500 font-bold">
                    {selectedTicketForDirective.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTicketForDirective.itemName} ({selectedTicketForDirective.location.floor} - {selectedTicketForDirective.location.roomOrArea})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicketForDirective(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Ticket Problem Summary */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                รายละเอียดปัญหาที่ได้รับแจ้ง:
              </span>
              <p className="text-slate-800 leading-relaxed font-medium">
                {selectedTicketForDirective.problemDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>ผู้แจ้ง: <b className="text-slate-700">{selectedTicketForDirective.reporter.name}</b> ({selectedTicketForDirective.reporter.phone})</span>
                <span>ระดับความด่วน: <b className="text-red-700">{selectedTicketForDirective.urgency}</b></span>
              </div>
            </div>

            {/* Directive Form */}
            <form onSubmit={handleSubmitDirective} className="mt-5 space-y-4">
              {/* Executive Author Position Preview */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-red-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${activeProfile.avatarColor} flex items-center justify-center font-bold text-sm`}>
                    {activeProfile.title[0]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-300">{activeProfile.name}</div>
                    <div className="text-[11px] text-slate-300">{activeProfile.position}</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 font-semibold text-white">
                  ผู้ลงนามสั่งการ
                </span>
              </div>

              {/* Directive Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  ประเภทการสั่งการ / ข้อคิดเห็น:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirectiveType('urgent_directive')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                      directiveType === 'urgent_directive'
                        ? 'border-red-500 bg-red-50 text-red-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    <span>คำสั่งการเร่งด่วน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectiveType('budget_approval')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                      directiveType === 'budget_approval'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>อนุมัติงบ/จัดซื้อ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectiveType('preventative_action')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                      directiveType === 'preventative_action'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                    <span>มาตรการป้องกัน</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectiveType('assign_task')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 ${
                      directiveType === 'assign_task'
                        ? 'border-purple-500 bg-purple-50 text-purple-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                    <span>มอบหมายงานพิเศษ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirectiveType('comment')}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all flex items-center gap-1.5 col-span-2 sm:col-span-2 ${
                      directiveType === 'comment'
                        ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>ข้อคิดเห็น / ข้อเสนอแนะทั่วไป</span>
                  </button>
                </div>
              </div>

              {/* Quick Template Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  เลือกข้อความแม่แบบคำสั่งการด่วน (Preset Templates):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {presetTemplates.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDirectiveType(item.type);
                        setDirectiveContent(item.text);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directive Content */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  ข้อความคำสั่งการ / ข้อคิดเห็นของผู้บริหาร (Directive / Comment):
                </label>
                <textarea
                  rows={4}
                  required
                  value={directiveContent}
                  onChange={(e) => setDirectiveContent(e.target.value)}
                  placeholder="พิมพ์ข้อความสั่งการ หรือข้อคิดเห็นของผู้บริหาร เช่น กำชับให้เข้าแก้ไขทันที หรืออนุมัติให้จัดซื้ออะไหล่สำรอง..."
                  className="w-full p-3 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none leading-relaxed"
                />
              </div>

              {/* Google Chat Notification Checkbox */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyChat}
                    onChange={(e) => setNotifyChat(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-amber-950">
                    แจ้งเตือนคำสั่งการเข้า Google Chat ของทีมงานทันที
                  </span>
                </label>
                <span className="text-[10px] text-amber-700 font-mono">
                  5W1H Dispatch
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForDirective(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || !directiveContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกและออกคำสั่งการอย่างเป็นทางการ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
