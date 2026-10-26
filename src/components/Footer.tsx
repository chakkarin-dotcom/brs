import React from 'react';
import { Phone, Mail, MapPin, Building, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16 border-t border-slate-800">
      {/* Primary contact banner per requirement 8 */}
      <div className="bg-gradient-to-r from-red-900/90 via-slate-900 to-slate-900 border-b border-red-800/40 py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-full bg-red-600/30 border border-red-500/40 flex items-center justify-center shrink-0 text-red-300 mt-1 sm:mt-0">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-white font-medium text-sm sm:text-base leading-relaxed" id="footer-mandatory-contact-text">
                หากมีข้อสงสัยโปรดติดต่อ นายจักรินทร์ ศิลารัตน์ ตำแหน่ง นักเทคโนโลยีสารสนเทศ ชำนาญการ โทร.44843 มือถือ 089-9419494 email:chakkarin@kku.ac.th
              </p>
              <p className="text-xs text-red-200/80 mt-0.5">
                สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น (อาคารพจน์ สารสิน)
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="tel:0899419494"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>โทรด่วน</span>
            </a>
            <a
              href="mailto:chakkarin@kku.ac.th?subject=สอบถามงานแจ้งซ่อมอาคารพจน์ สารสิน มข."
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>ส่งอีเมล</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main footer details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building className="w-5 h-5 text-amber-500" />
              <h3 className="text-white font-semibold text-sm">
                อาคารพจน์ สารสิน
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              ศูนย์รวมการจัดการเรียนการสอนหมวดวิชาศึกษาทั่วไป (General Education) และบริการสนับสนุนนักศึกษามหาวิทยาลัยขอนแก่น
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <span>อาคารพจน์ สารสิน มหาวิทยาลัยขอนแก่น 123 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40002</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              ระบบที่ให้บริการแจ้งซ่อม
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5">
              <li>• ระบบประกอบอาคาร (แอร์, หลอดไฟ, ประปา, ปั้มน้ำ, แทงค์น้ำ, ลิฟท์)</li>
              <li>• ระบบโสตทัศนูปกรณ์ในห้องเรียน (คอมพิวเตอร์, เสียง, โปรเจ็คเตอร์, TV)</li>
              <li>• ระบบรักษาความปลอดภัย (กล้อง CCTV, ไม้กั้นทางเข้า-ออก)</li>
              <li>• ระบบสาธารณูปโภค (น้ำดื่ม, เครื่องกรองน้ำ, ท่อประปา)</li>
              <li>• ระบบสุขาภิบาล (สายฉีดชำระ, โถปัสสาวะ, โถชักโครก)</li>
              <li>• ระบบกายภาพ (ลานจอดรถ P1-P5, ถนนเส้นใหม่ทางเข้าลานจอด P3)</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3">
              ช่องทางการแจ้งเตือน
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              ระบบส่งข้อมูล 5W1H สรุปคำร้องเข้า Google Chat อัตโนมัติถึงเจ้าหน้าที่ (chakkarin@kku.ac.th) และสำเนาหัวหน้างานบริหาร (sutako@kku.ac.th) เพื่อความรวดเร็วและตรวจสอบได้
            </p>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className="text-amber-400 font-semibold block mb-1">
                เวลาทำการงานซ่อมบำรุง
              </span>
              <span className="text-slate-300">
                วันจันทร์ - วันศุกร์ เวลา 08:30 - 16:30 น. (กรณีเหตุด่วนฉุกเฉินติดต่อได้ตลอด 24 ชั่วโมง)
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 mt-4 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น. All rights reserved.</p>
          <p>ระบบแจ้งซ่อมและบริหารจัดการอาคารพจน์ สารสิน v2.4 (5W1H & Google Chat Integration)</p>
        </div>
      </div>
    </footer>
  );
};
