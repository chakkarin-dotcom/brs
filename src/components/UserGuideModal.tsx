import React from 'react';
import {
  HelpCircle,
  Wrench,
  Search,
  BarChart3,
  Award,
  Star,
  Bell,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                คู่มือการใช้งานระบบ
              </h3>
              <p className="text-xs text-slate-500">
                ระบบบริหารจัดการและแจ้งซ่อมบำรุง อาคารพจน์ สารสิน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Workflow Diagram */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-900 text-white">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-4">
            <span className="text-lg">📋</span>
            <span>Work Flow — ขั้นตอนการทำงานของระบบ</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-center text-xs">
            <div className="p-3 rounded-xl bg-red-700/30 border border-red-600/40">
              <span className="block text-lg mb-1">📝</span>
              <span className="font-bold text-red-200">1. ผู้แจ้ง</span>
              <span className="block text-slate-300 mt-0.5">กรอกแบบฟอร์มแจ้งซ่อม</span>
            </div>
            <div className="flex items-center justify-center text-2xl text-slate-500">→</div>
            <div className="p-3 rounded-xl bg-amber-700/30 border border-amber-600/40">
              <span className="block text-lg mb-1">🤖</span>
              <span className="font-bold text-amber-200">2. ระบบ 5W1H</span>
              <span className="block text-slate-300 mt-0.5">ส่งสรุปเข้า Google Chat</span>
            </div>
            <div className="flex items-center justify-center text-2xl text-slate-500">→</div>
            <div className="p-3 rounded-xl bg-emerald-700/30 border border-emerald-600/40">
              <span className="block text-lg mb-1">👨‍🔧</span>
              <span className="font-bold text-emerald-200">3. เจ้าหน้าที่</span>
              <span className="block text-slate-300 mt-0.5">รับเรื่อง + เปลี่ยนสถานะ</span>
            </div>
            <div className="flex items-center justify-center text-2xl text-slate-500">→</div>
            <div className="p-3 rounded-xl bg-blue-700/30 border border-blue-600/40">
              <span className="block text-lg mb-1">📢</span>
              <span className="font-bold text-blue-200">4. Auto-Notify</span>
              <span className="block text-slate-300 mt-0.5">แจ้งผู้ใช้ทุกครั้งที่สถานะเปลี่ยน</span>
            </div>
            <div className="flex items-center justify-center text-2xl text-slate-500">→</div>
            <div className="p-3 rounded-xl bg-purple-700/30 border border-purple-600/40">
              <span className="block text-lg mb-1">⭐</span>
              <span className="font-bold text-purple-200">5. ผู้ใช้ประเมิน</span>
              <span className="block text-slate-300 mt-0.5">ให้คะแนนความพึงพอใจ 5 ดาว</span>
            </div>
          </div>
        </div>

        {/* Detailed Steps by Role */}
        <div className="mt-6 space-y-5">
          {/* For General Users / Reporters */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-red-600" />
              สำหรับผู้แจ้งซ่อม (ผู้ใช้บริการ)
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>คลิกแท็บ <b>แจ้งซ่อม</b> → เลือกหมวดหมู่อุปกรณ์ → ระบุสถานที่ อาการชำรุด และข้อมูลผู้แจ้ง</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>เลือกระดับความเร่งด่วน (ปกติ/ด่วน/ด่วนที่สุด) และช่องทางที่ต้องการให้แจ้งผลกลับ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>กด <b>ยืนยันส่งคำร้อง</b> — ระบบจะสร้างรหัสคำร้องและส่งสรุป 5W1H ไปยัง Google Chat ทันที</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <span>กด <b>ติดตามสถานะทันที</b> เพื่อดูความคืบหน้า ระบบจะแจ้งผลกลับอัตโนมัติทุกครั้งที่สถานะเปลี่ยน</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                <span>เมื่องานแล้วเสร็จ → ระบบจะเปิดหน้าต่าง <b>ประเมินความพึงพอใจ 5 ดาว</b> ด้านคุณภาพ ด้านความรวดเร็ว ด้านความพร้อมของเครื่องมือ และความพึงพอใจภาพรวม</span>
              </li>
            </ul>
          </div>

          {/* For Officers / Admins */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-red-50/40">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              สำหรับเจ้าหน้าที่ / ผู้ดูแลระบบ (Super Admin)
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>เปิดแท็บ <b>ติดตามสถานะ</b> → คลิกคำร้องเพื่อดูรายละเอียด</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>กดปุ่ม <b>Super Admin</b> ที่ Navbar → ปิด/เปิด หรือกด <b>ระบบจัดการ</b> เพื่อจัดการ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>เปลี่ยนสถานะคำร้องผ่าน <b>Quick Actions</b> (ปรับเป็น "กำลังดำเนินการ", "รออะไหล่", "แล้วเสร็จ") — ระบบแจ้งผู้ใช้โดยอัตโนมัติ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <span>กดปุ่ม <b>Google Chat</b> เพื่อดูการ์ด 5W1H ที่ส่ง หรือกด <b>แจ้งกลับผู้แจ้ง</b> เพื่อส่งข้อความเพิ่มเติม</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">5</span>
                <span>จัดการหมวดหมู่อุปกรณ์, ข้อมูลเจ้าหน้าที่ และ Webhook URL ได้ใน <b>ระบบจัดการ</b></span>
              </li>
            </ul>
          </div>

          {/* For Executives */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50/50 to-red-50/50">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-600" />
              สำหรับผู้บริหาร (ผู้อำนวยการ / รองผู้อำนวยการฝ่ายบริหาร)
            </h4>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>สลับบทบาทที่ Navbar → <b>ผู้อำนวยการ</b> หรือ <b>รอง ผอ. ฝ่ายบริหาร</b></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>ไปที่แท็บ <b>มุมมองผู้บริหาร</b> เพื่อดูสรุปคำร้อง พร้อมให้คำสั่งการ / ข้อคิดเห็น</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>ในหน้ารายละเอียดคำร้อง → กด <b>+ สั่งการ / ให้ความเห็น</b> เพื่อบันทึกคำสั่งการหรือข้อเสนอแนะ</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">4</span>
                <span>ระบบจะส่งคำสั่งการเข้า Google Chat ของทีมงาน (ถ้าเปิดตัวเลือก)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Features Summary */}
        <div className="mt-6 p-5 rounded-2xl bg-white border-2 border-slate-200">
          <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            ✨
            <span>ความสามารถทั้งหมดของระบบ</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>แจ้งซ่อมออนไลน์</b> — กรอกแบบฟอร์ม พร้อมแนบรูปภาพ</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>5W1H Auto Summary</b> — สรุปและส่งเข้า Google Chat อัตโนมัติ</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>Auto-Notify</b> — แจ้งผู้ใช้ทุกครั้งที่สถานะเปลี่ยน (กำลังดำเนินการ/รออะไหล่/แล้วเสร็จ)</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>ประเมิน 5 ดาว</b> — ผู้ใช้ประเมินความพึงพอใจ 4 ด้าน (คุณภาพ/ความรวดเร็ว/ความพร้อมของเครื่องมือ/ภาพรวม)</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>Dashboard สรุปผล</b> — สถิติ วิเคราะห์ตามหมวดหมู่ ช่วงเวลา</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>Export Excel</b> — ส่งออกรายงานเป็น .xlsx</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>มุมมองผู้บริหาร</b> — คำสั่งการ/ข้อคิดเห็นของ ผอ. และรอง ผอ.</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>Super Admin</b> — จัดการหมวดหมู่, ข้อมูลเจ้าหน้าที่, Webhook URL</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>Google Sheets sync</b> — ฐานข้อมูลบน Google Sheets (Cloud)</span>
            </div>
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50">
              <span className="text-emerald-600 font-bold shrink-0">✔</span>
              <span><b>แจ้งกลับผู้แจ้ง</b> — ส่งข้อความแจ้งผลด้วยตนเองผ่าน Email/Phone/SMS/LINE</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
          >
            ปิดคู่มือ
          </button>
        </div>
      </div>
    </div>
  );
};