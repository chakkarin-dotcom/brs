import React, { useRef, useState } from 'react';
import { 
  Phone, 
  Mail, 
  Camera, 
  CheckCircle2, 
  Copy, 
  Check, 
  Edit3, 
  ExternalLink,
  ShieldCheck,
  Building
} from 'lucide-react';
import { OfficerProfile } from '../types';

interface OfficerCardProps {
  officer: OfficerProfile;
  onUpdateOfficer: (updated: OfficerProfile) => void;
  isSuperAdmin: boolean;
}

export const OfficerCard: React.FC<OfficerCardProps> = ({
  officer,
  onUpdateOfficer,
  isSuperAdmin,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(officer);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const updated = { ...officer, photoUrl: result };
        onUpdateOfficer(updated);
        setEditForm((prev) => ({ ...prev, photoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyContact = () => {
    const text = `${officer.name} (${officer.position}) โทร.${officer.internalPhone} มือถือ ${officer.mobilePhone} อีเมล ${officer.email}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateOfficer(editForm);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden transition-all hover:shadow-md">
      {/* Decorative accent top bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-700 via-amber-500 to-red-600" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Officer Photo with Upload Trigger */}
        <div className="relative group shrink-0">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-red-100 shadow-md bg-slate-100 flex items-center justify-center">
            {officer.photoUrl ? (
              <img
                src={officer.photoUrl}
                alt={officer.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/chakkarin2.jpg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                ไม่มีรูปภาพ
              </div>
            )}
          </div>

          {/* Quick upload photo button - Super Admin only */}
          {isSuperAdmin && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                id="btn-upload-officer-photo"
                className="absolute bottom-1 right-1 p-2 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white shadow-md backdrop-blur-xs transition-all hover:scale-110"
                title="เปลี่ยนภาพถ่ายเจ้าหน้าที่"
                type="button"
              >
                <Camera className="w-4 h-4 text-amber-300" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
            </>
          )}

          {/* Status badge */}
          <div className="absolute -top-2 -left-2 bg-emerald-600 text-white text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-white">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>พร้อมปฏิบัติหน้าที่</span>
          </div>
        </div>

        {/* Officer Information */}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              เจ้าหน้าที่ผู้รับผิดชอบงานระบบ
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyContact}
                className="text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1"
                title="คัดลอกข้อมูลติดต่อ"
                type="button"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
              
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setEditForm(officer);
                    setIsEditing(true);
                  }}
                  className="text-xs text-slate-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
                  title="แก้ไขข้อมูลเจ้าหน้าที่"
                  type="button"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">แก้ไขข้อมูล</span>
                </button>
              )}
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            {officer.name}
          </h3>
          <p className="text-sm font-medium text-red-700 mt-0.5">
            {officer.position}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500 mt-1">
            <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>{officer.organization}</span>
          </div>

          {/* Contact Pills */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <a
              href={`tel:${officer.internalPhone}`}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-red-50/70 border border-slate-200/80 text-slate-700 hover:text-red-700 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-700 group-hover:bg-red-200">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium">โทรภายใน มข.</div>
                <div className="font-semibold text-slate-900">{officer.internalPhone}</div>
              </div>
            </a>

            <a
              href={`tel:${officer.mobilePhone}`}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-red-50/70 border border-slate-200/80 text-slate-700 hover:text-red-700 transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-200">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium">เบอร์มือถือสายตรง</div>
                <div className="font-semibold text-slate-900">{officer.mobilePhone}</div>
              </div>
            </a>

            <a
              href={`mailto:${officer.email}`}
              className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 hover:bg-red-50/70 border border-slate-200/80 text-slate-700 hover:text-red-700 transition-colors group sm:col-span-2 lg:col-span-1"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-200">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <div className="text-left truncate">
                <div className="text-[10px] text-slate-400 font-medium">อีเมล (Google Workspace)</div>
                <div className="font-semibold text-slate-900 truncate">{officer.email}</div>
              </div>
            </a>
          </div>

          <div className="mt-3 flex items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>{officer.workHours}</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal - Super Admin only */}
      {isSuperAdmin && isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h4 className="font-bold text-slate-900 text-base">
                แก้ไขข้อมูลเจ้าหน้าที่ผู้ดูแลระบบ
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ตำแหน่ง
                </label>
                <input
                  type="text"
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  หน่วยงาน / สังกัด
                </label>
                <input
                  type="text"
                  value={editForm.organization}
                  onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    โทรศัพท์ภายใน
                  </label>
                  <input
                    type="text"
                    value={editForm.internalPhone}
                    onChange={(e) => setEditForm({ ...editForm, internalPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    เบอร์มือถือ
                  </label>
                  <input
                    type="text"
                    value={editForm.mobilePhone}
                    onChange={(e) => setEditForm({ ...editForm, mobilePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  อีเมล (สำหรับรับแจ้งเตือน Google Chat)
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ลิงก์ URL รูปภาพ (หรือใช้ปุ่มกล้องอัปโหลดไฟล์จริง)
                </label>
                <input
                  type="url"
                  value={editForm.photoUrl}
                  onChange={(e) => setEditForm({ ...editForm, photoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
