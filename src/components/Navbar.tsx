import React from 'react';
import {
  Wrench,
  Search,
  BarChart3,
  ShieldCheck,
  PhoneCall,
  Building2,
  Lock,
  Award,
  UserCheck,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { ExecutiveRole } from '../types';

interface NavbarProps {
  activeTab: 'form' | 'tracking' | 'dashboard' | 'executive';
  setActiveTab: (tab: 'form' | 'tracking' | 'dashboard' | 'executive') => void;
  isSuperAdmin: boolean;
  setIsSuperAdmin: (val: boolean) => void;
  openAdminModal: () => void;
  currentRole: ExecutiveRole;
  setCurrentRole: (role: ExecutiveRole) => void;
  onOpenGuide: () => void;
  superAdminEmails: string[];
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSuperAdmin,
  setIsSuperAdmin,
  openAdminModal,
  currentRole,
  setCurrentRole,
  onOpenGuide,
  superAdminEmails,
}) => {
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = React.useState(false);
  const [verifyEmail, setVerifyEmail] = React.useState('');
  const [verifyError, setVerifyError] = React.useState('');

  const getRoleLabel = (role: ExecutiveRole) => {
    switch (role) {
      case 'director':
        return 'ผู้อำนวยการ';
      case 'deputy_director_admin':
        return 'รอง ผอ. ฝ่ายบริหาร';
      default:
        return 'ผู้ใช้งานทั่วไป';
    }
  };
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top emergency announcement bar */}
      <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-slate-950">
              แจ้งเหตุด่วนอาคาร
            </span>
            <span className="hidden sm:inline text-slate-300">
              สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น (KKU)
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <a 
              href="tel:44843" 
              className="flex items-center gap-1 hover:text-amber-400 transition-colors font-medium"
              title="โทรเบอร์ภายใน 44843"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>โทรภายใน: 44843</span>
            </a>
            <span className="text-slate-600">|</span>
            <a 
              href="tel:0899419494" 
              className="hover:text-amber-400 transition-colors hidden md:inline"
            >
              สายด่วน: 089-9419494
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('form')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
            id="brand-logo-btn"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-800 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-950/10 group-hover:scale-105 transition-transform duration-200">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  KKU GE
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  อาคารพจน์ สารสิน
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight group-hover:text-red-700 transition-colors">
                ระบบซ่อมอาคารพจน์ สารสิน
              </h1>
              <p className="text-xs text-slate-500 hidden md:block">
                สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น
              </p>
            </div>
          </div>

          {/* Center Tabs for Desktop */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="tab-request-btn"
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'form'
                  ? 'bg-white text-red-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>แจ้งซ่อม / ร้องขอ</span>
            </button>

            <button
              id="tab-tracking-btn"
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'tracking'
                  ? 'bg-white text-red-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>ติดตามสถานะ</span>
            </button>

            <button
              id="tab-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-red-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard สรุปผล</span>
            </button>

            <button
              id="tab-executive-btn"
              onClick={() => setActiveTab('executive')}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'executive'
                  ? 'bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-xs font-semibold'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>มุมมองผู้บริหาร</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold">
                ผอ./รอง ผอ.
              </span>
            </button>
          </nav>

          {/* Right Controls: Executive Persona Switcher + Help + Super Admin */}
          <div className="flex items-center gap-2">
            {/* Help / User Guide Button */}
            <button
              type="button"
              onClick={onOpenGuide}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-red-700 flex items-center justify-center transition-all"
              title="คู่มือการใช้งาน"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {/* Executive Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="nav-role-dropdown-btn"
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs transition-colors"
                title="สลับมุมมองบทบาท (ผู้บริหาร / เจ้าหน้าที่)"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">มุมมอง:</span>
                <span className="font-bold text-red-800">{getRoleLabel(currentRole)}</span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    สลับบทบาทการใช้งาน
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('director');
                      setShowRoleMenu(false);
                      setActiveTab('executive');
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentRole === 'director' ? 'text-red-700 font-bold bg-red-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div>ผู้อำนวยการสถาบันฯ</div>
                      <div className="text-[10px] text-slate-400">รศ.ดร.นรินทร์ ชมภูพวง</div>
                    </div>
                    {currentRole === 'director' && <span className="text-red-600 font-bold">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('deputy_director_admin');
                      setShowRoleMenu(false);
                      setActiveTab('executive');
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentRole === 'deputy_director_admin' ? 'text-blue-700 font-bold bg-blue-50/50' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div>รองผู้อำนวยการฝ่ายบริหาร</div>
                      <div className="text-[10px] text-slate-400">รศ.ดร.นาฎนภา หีบแก้ว ปัดชาสุวรรณ์</div>
                    </div>
                    {currentRole === 'deputy_director_admin' && <span className="text-blue-600 font-bold">✓</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentRole('staff');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                      currentRole === 'staff' ? 'text-slate-900 font-bold bg-slate-100' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div>เจ้าหน้าที่ / ผู้ใช้ทั่วไป</div>
                      <div className="text-[10px] text-slate-400">มุมมองผู้แจ้งและช่างอาคาร</div>
                    </div>
                    {currentRole === 'staff' && <span className="text-slate-900 font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {isSuperAdmin ? (
              <button
                id="btn-super-admin-manage"
                onClick={openAdminModal}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm transition-all"
                title="จัดการระบบ Super Admin"
              >
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">ระบบจัดการ</span>
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-red-800 text-red-100 font-mono">
                  Super Admin
                </span>
              </button>
            ) : (
              <button
                id="btn-super-admin-login"
                onClick={() => {
                  setVerifyEmail('');
                  setVerifyError('');
                  setShowVerifyDialog(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                title="เข้าสู่ระบบผู้ดูแลระบบ"
              >
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Super Admin</span>
              </button>
            )}

            {/* Email verification dialog */}
            {showVerifyDialog && (
              <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm">ยืนยันตัวตนผู้ดูแลระบบ</h3>
                  <p className="text-xs text-slate-500 mt-1">กรุณากรอกอีเมลของคุณเพื่อเข้าสู่ระบบ Super Admin</p>
                  <input
                    type="email"
                    value={verifyEmail}
                    onChange={(e) => { setVerifyEmail(e.target.value); setVerifyError(''); }}
                    placeholder="อีเมล @kku.ac.th"
                    className="w-full mt-3 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const match = superAdminEmails.some((em) => em.toLowerCase() === verifyEmail.trim().toLowerCase());
                        if (match) {
                          setShowVerifyDialog(false);
                          setIsSuperAdmin(true);
                          openAdminModal();
                        } else {
                          setVerifyError('ไม่พบอีเมลนี้ในรายการผู้ดูแลระบบ');
                        }
                      }
                    }}
                  />
                  {verifyError && <p className="text-red-600 text-[11px] mt-1.5">{verifyError}</p>}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200">
                    <button
                      onClick={() => setShowVerifyDialog(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => {
                        const match = superAdminEmails.some((em) => em.toLowerCase() === verifyEmail.trim().toLowerCase());
                        if (match) {
                          setShowVerifyDialog(false);
                          setIsSuperAdmin(true);
                          openAdminModal();
                        } else {
                          setVerifyError('ไม่พบอีเมลนี้ในรายการผู้ดูแลระบบ');
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      ยืนยัน
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      <div className="lg:hidden border-t border-slate-200 bg-white grid grid-cols-4 px-2 py-1 text-center">
        <button
          onClick={() => setActiveTab('form')}
          className={`py-2 text-[11px] flex flex-col items-center gap-1 ${
            activeTab === 'form' ? 'text-red-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>แจ้งซ่อม</span>
        </button>
        <button
          onClick={() => setActiveTab('tracking')}
          className={`py-2 text-[11px] flex flex-col items-center gap-1 ${
            activeTab === 'tracking' ? 'text-red-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>ติดตาม</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-2 text-[11px] flex flex-col items-center gap-1 ${
            activeTab === 'dashboard' ? 'text-red-700 font-semibold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('executive')}
          className={`py-2 text-[11px] flex flex-col items-center gap-1 ${
            activeTab === 'executive' ? 'text-amber-800 font-bold' : 'text-slate-500'
          }`}
        >
          <Award className="w-4 h-4 text-amber-600" />
          <span>ผู้บริหาร</span>
        </button>
      </div>
    </header>
  );
};
