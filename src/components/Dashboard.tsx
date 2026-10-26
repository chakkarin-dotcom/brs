import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Wrench, 
  Building2, 
  Tv, 
  ShieldCheck, 
  Droplet, 
  Sparkles, 
  Car,
  TrendingUp,
  FileSpreadsheet,
  MessageSquare,
  Percent,
  Star
} from 'lucide-react';
import { MaintenanceCategory, MaintenanceTicket } from '../types';
import { exportTicketsToExcel } from '../utils/excelExport';

interface DashboardProps {
  tickets: MaintenanceTicket[];
  categories: MaintenanceCategory[];
  onSelectTicket: (ticketId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  tickets,
  categories,
  onSelectTicket,
}) => {
  // Requirement 5: "และทุกอย่างจะถูกรวบรวมและมีรายงานสรุปทุก 1 เดือนใน dashboard และสารถสรุป รอบ 3 เดือน 6 เดือน 12 เดือนได้"
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | '12m' | 'all'>('1m');

  // Filter tickets by timeframe based on current date
  const now = new Date();
  const filteredTickets = tickets.filter((t) => {
    if (timeframe === 'all') return true;
    const ticketDate = new Date(t.createdAt).getTime();
    let days = 30;
    if (timeframe === '1m') days = 30;
    else if (timeframe === '3m') days = 90;
    else if (timeframe === '6m') days = 180;
    else if (timeframe === '12m') days = 365;

    const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
    return ticketDate >= cutoff;
  });

  // KPI calculations
  const total = filteredTickets.length;
  const completed = filteredTickets.filter((t) => t.status === 'completed').length;
  const inProgress = filteredTickets.filter((t) => t.status === 'in_progress').length;
  const pending = filteredTickets.filter((t) => t.status === 'pending').length;
  const waitingParts = filteredTickets.filter((t) => t.status === 'waiting_parts').length;
  const critical = filteredTickets.filter((t) => t.urgency === 'critical').length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Average repair duration calculation
  const completedWithTime = filteredTickets.filter((t) => t.completedAt);
  let avgDurationHours = 0;
  if (completedWithTime.length > 0) {
    const totalMs = completedWithTime.reduce((acc, t) => {
      return acc + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime());
    }, 0);
    avgDurationHours = Math.round(totalMs / completedWithTime.length / (1000 * 60 * 60));
  }

  // Category breakdown
  const categoryStats = categories.map((cat) => {
    const catTickets = filteredTickets.filter((t) => t.categoryId === cat.id);
    const count = catTickets.length;
    const catCompleted = catTickets.filter((t) => t.status === 'completed').length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      category: cat,
      count,
      completed: catCompleted,
      percent,
    };
  });

  // Urgency breakdown
  const normalCount = filteredTickets.filter((t) => t.urgency === 'normal').length;
  const urgentCount = filteredTickets.filter((t) => t.urgency === 'urgent').length;
  const criticalCount = filteredTickets.filter((t) => t.urgency === 'critical').length;

  // Floor / Zone breakdown

  // Satisfaction rating metrics
  const ratedTickets = filteredTickets.filter((t) => t.satisfactionRating);
  const ratingCount = ratedTickets.length;
  const avgRating = ratingCount > 0
    ? {
        quality: Math.round(ratedTickets.reduce((s, t) => s + (t.satisfactionRating!.quality || 0), 0) / ratingCount * 10) / 10,
        speed: Math.round(ratedTickets.reduce((s, t) => s + (t.satisfactionRating!.speed || 0), 0) / ratingCount * 10) / 10,
        equipment: Math.round(ratedTickets.reduce((s, t) => s + (t.satisfactionRating!.equipment || 0), 0) / ratingCount * 10) / 10,
        overall: Math.round(ratedTickets.reduce((s, t) => s + (t.satisfactionRating!.overall || 0), 0) / ratingCount * 10) / 10,
      }
    : null;
  const floorCounts: Record<string, number> = {};
  filteredTickets.forEach((t) => {
    const f = t.location.floor || 'อื่นๆ';
    floorCounts[f] = (floorCounts[f] || 0) + 1;
  });

  const handleExportExcel = () => {
    const label =
      timeframe === '1m'
        ? 'รอบ1เดือน'
        : timeframe === '3m'
        ? 'รอบ3เดือน'
        : timeframe === '6m'
        ? 'รอบ6เดือน'
        : timeframe === '12m'
        ? 'รอบ12เดือน'
        : 'ทั้งหมด';
    exportTicketsToExcel(filteredTickets, `รายงานแจ้งซ่อม_อาคารพจน์สารสิน_${label}`);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-4 h-4" />;
      case 'Tv': return <Tv className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Droplet': return <Droplet className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Car': return <Car className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Timeframe Filters (Requirement 5) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                สถิติและรายงานสรุปผล
              </span>
              <span className="text-xs text-slate-500">
                อาคารพจน์ สารสิน สถาบันการสอนวิชาศึกษาทั่วไป มข.
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dashboard สรุปภาพรวมงานซ่อมบำรุง
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              วิเคราะห์ปริมาณงานซ่อม ประสิทธิภาพการแก้ไขปัญหา และสถิติแยกตามหมวดหมู่งาน
            </p>
          </div>

          {/* Timeframe selector & Excel export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Requirement 5 Timeframe Filter Buttons */}
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-medium">
              <button
                onClick={() => setTimeframe('1m')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeframe === '1m'
                    ? 'bg-white text-red-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รอบ 1 เดือน
              </button>
              <button
                onClick={() => setTimeframe('3m')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeframe === '3m'
                    ? 'bg-white text-red-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รอบ 3 เดือน
              </button>
              <button
                onClick={() => setTimeframe('6m')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeframe === '6m'
                    ? 'bg-white text-red-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รอบ 6 เดือน
              </button>
              <button
                onClick={() => setTimeframe('12m')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeframe === '12m'
                    ? 'bg-white text-red-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                รอบ 12 เดือน
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeframe === 'all'
                    ? 'bg-white text-red-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทั้งหมด
              </button>
            </div>

            {/* Requirement 6: Export to Excel Button */}
            <button
              onClick={handleExportExcel}
              id="btn-export-excel"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all hover:scale-105"
              title="ส่งออกรายงานเป็นไฟล์ Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export ไฟล์ Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* High-Level Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 block">คำร้องทั้งหมด</span>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">
              {total}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {timeframe === 'all' ? 'ทุกช่วงเวลา' : `ในช่วง ${timeframe}`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 block">แล้วเสร็จ</span>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1 font-mono">
              {completed}
            </div>
            <span className="text-[10px] text-emerald-600 mt-1 block">
              ความสำเร็จ {completionRate}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200">
            <span className="text-[11px] font-semibold text-blue-800 block">กำลังดำเนินการ</span>
            <div className="text-2xl sm:text-3xl font-bold text-blue-700 mt-1 font-mono">
              {inProgress}
            </div>
            <span className="text-[10px] text-blue-600 mt-1 block">
              ช่างกำลังเข้าดูแล
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
            <span className="text-[11px] font-semibold text-amber-800 block">รอรับเรื่อง / รออะไหล่</span>
            <div className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1 font-mono">
              {pending + waitingParts}
            </div>
            <span className="text-[10px] text-amber-600 mt-1 block">
              รอรับ {pending} | รออะไหล่ {waitingParts}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-red-800 block">ระยะเวลาเฉลี่ย</span>
            <div className="text-2xl sm:text-3xl font-bold text-red-700 mt-1 font-mono">
              {avgDurationHours > 0 ? `${avgDurationHours} ชม.` : 'รวดเร็ว'}
            </div>
            <span className="text-[10px] text-red-600 mt-1 block">
              จนถึงขั้นแล้วเสร็จ
            </span>
          </div>
        </div>
      </div>

      {/* Requirement 4: Breakdown by Category (ระบบแยกตามประเภทของงาน) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              ปริมาณงานซ่อมแยกตามประเภทระบบอาคารพจน์ สารสิน
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุป 6 หมวดหมู่งานระบบหลักของสถาบันการสอนวิชาศึกษาทั่วไป
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            รวม {total} รายการ
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map(({ category, count, completed: catComp, percent }) => (
            <div
              key={category.id}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: category.color }}
                  >
                    {getCategoryIcon(category.iconName)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {category.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      รหัส {category.code}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-400 block">งาน</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>สัดส่วน: {percent}%</span>
                <span>เสร็จแล้ว: <b className="text-emerald-700">{catComp}</b>/{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Urgency, Location & Google Chat Sync Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgency breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            สัดส่วนตามระดับความเร่งด่วน
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            แบ่งตามผลกระทบต่อการเรียนการสอน
          </p>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600" />
                <span className="text-xs font-semibold text-red-900">ด่วนที่สุด (Critical)</span>
              </div>
              <span className="text-sm font-bold text-red-700 font-mono">{criticalCount} รายการ</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-amber-900">ด่วน (Urgent)</span>
              </div>
              <span className="text-sm font-bold text-amber-700 font-mono">{urgentCount} รายการ</span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-emerald-900">ปกติ (Normal)</span>
              </div>
              <span className="text-sm font-bold text-emerald-700 font-mono">{normalCount} รายการ</span>
            </div>
          </div>
        </div>

        {/* Location distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            การกระจายตัวตามชั้นและโซน
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            จุดที่พบปัญหาบ่อยในอาคารพจน์ สารสิน
          </p>

          <div className="space-y-2 text-xs">
            {Object.entries(floorCounts).map(([fl, cnt]) => (
              <div key={fl} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-700 font-medium">{fl}</span>
                <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded bg-slate-100">
                  {cnt} งาน
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Requirement 5 Google Chat Dispatch Metrics */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-md border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Google Chat Auto Alert (5W1H)
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            การส่งสรุปคำร้อง 5W1H เข้า Google Chat อัตโนมัติ:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-amber-400 font-semibold block">เจ้าหน้าที่ผู้รับผิดชอบหลัก:</span>
              <span className="font-bold text-white block mt-0.5">chakkarin@kku.ac.th</span>
              <span className="text-[10px] text-slate-400">นายจักรินทร์ ศิลารัตน์ (นักเทคโนฯ ชำนาญการ)</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-amber-400 font-semibold block">สำเนาเพื่อรับทราบ:</span>
              <span className="font-bold text-white block mt-0.5">sutako@kku.ac.th</span>
              <span className="text-[10px] text-slate-400">หัวหน้างานบริหาร สถาบันวิชาศึกษาทั่วไป มข.</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>ส่งแจ้งเตือนสำเร็จ:</span>
            <span className="font-bold text-emerald-400 font-mono">100% ({total}/{total})</span>
          </div>
        </div>
      </div>

      {/* Satisfaction Rating Summary */}
      {ratingCount > 0 && avgRating && (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl border border-amber-200 shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">ผลประเมินความพึงพอใจ</h3>
              <p className="text-[11px] text-amber-700">จาก {ratingCount} รายการที่ประเมินแล้ว</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/70 rounded-xl px-3.5 py-3 border border-amber-100 text-center">
              <div className="text-[10px] text-amber-700 font-medium">ด้านคุณภาพ</div>
              <div className="text-lg font-bold text-amber-900 font-mono mt-0.5">
                {avgRating.quality.toFixed(1)} <span className="text-xs text-amber-600">/5</span>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl px-3.5 py-3 border border-amber-100 text-center">
              <div className="text-[10px] text-amber-700 font-medium">ด้านความรวดเร็ว</div>
              <div className="text-lg font-bold text-amber-900 font-mono mt-0.5">
                {avgRating.speed.toFixed(1)} <span className="text-xs text-amber-600">/5</span>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl px-3.5 py-3 border border-amber-100 text-center">
              <div className="text-[10px] text-amber-700 font-medium">ด้านความพร้อมเครื่องมือ</div>
              <div className="text-lg font-bold text-amber-900 font-mono mt-0.5">
                {avgRating.equipment.toFixed(1)} <span className="text-xs text-amber-600">/5</span>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl px-3.5 py-3 border border-amber-100 text-center">
              <div className="text-[10px] text-amber-700 font-medium">ภาพรวม</div>
              <div className="text-lg font-bold text-amber-900 font-mono mt-0.5">
                {avgRating.overall.toFixed(1)} <span className="text-xs text-amber-600">/5</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Tickets Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900">
            รายการแจ้งซ่อมล่าสุดในช่วงเวลานี้
          </h3>
          <button
            onClick={handleExportExcel}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดาวน์โหลด Excel</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">รหัส</th>
                <th className="py-2.5 px-3 font-semibold">รายการอุปกรณ์</th>
                <th className="py-2.5 px-3 font-semibold">สถานที่</th>
                <th className="py-2.5 px-3 font-semibold">ผู้แจ้ง</th>
                <th className="py-2.5 px-3 font-semibold">ความเร่งด่วน</th>
                <th className="py-2.5 px-3 font-semibold">สถานะ</th>
                <th className="py-2.5 px-3 font-semibold">วันเวลาที่แจ้ง</th>
                <th className="py-2.5 px-3 font-semibold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.slice(0, 10).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">{t.id}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{t.itemName}</td>
                  <td className="py-3 px-3 text-slate-600">{t.location.roomOrArea}</td>
                  <td className="py-3 px-3 text-slate-600">{t.reporter.name}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.urgency === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : t.urgency === 'urgent'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t.urgency === 'critical' ? 'ด่วนที่สุด' : t.urgency === 'urgent' ? 'ด่วน' : 'ปกติ'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status === 'completed' ? 'แล้วเสร็จ' : t.status === 'in_progress' ? 'กำลังซ่อม' : 'รอรับเรื่อง'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">
                    {new Date(t.createdAt).toLocaleDateString('th-TH')}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectTicket(t.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-medium transition-colors"
                    >
                      ดูข้อมูล
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
