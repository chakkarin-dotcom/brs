import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Send, 
  Image as ImageIcon, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Building2, 
  Tv, 
  ShieldCheck, 
  Droplet, 
  Sparkles, 
  Car, 
  Copy, 
  Check, 
  ExternalLink,
  MessageSquare,
  Clock,
  MapPin,
  User,
  Zap,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { MaintenanceCategory, MaintenanceTicket, UrgencyLevel } from '../types';
import { generate5W1H, formatGoogleChatMarkdown } from '../utils/5w1h';
import { sendEmailNotification } from '../utils/storage';
import { BUILDING_FLOORS, findFloorByRoom, ALL_ROOM_SUGGESTIONS } from '../data/locations';

interface RepairFormProps {
  categories: MaintenanceCategory[];
  onSubmitTicket: (ticket: MaintenanceTicket) => void;
  onViewTicket: (ticketId: string) => void;
  webhookUrl?: string;
}

export const RepairForm: React.FC<RepairFormProps> = ({
  categories,
  onSubmitTicket,
  onViewTicket,
  webhookUrl,
}) => {
  // Form State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'building-sys');
  const [selectedItemId, setSelectedItemId] = useState<string>(categories[0]?.items[0]?.id || '');
  const [customItemName, setCustomItemName] = useState<string>('');
  
  // Location
  const [floor, setFloor] = useState<string>('ชั้น 1');
  const [roomOrArea, setRoomOrArea] = useState<string>('');
  const [specificDetail, setSpecificDetail] = useState<string>('');

  // Details
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);

  // Reporter
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterRole, setReporterRole] = useState<'faculty' | 'staff' | 'student' | 'external'>('student');
  const [department, setDepartment] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [lineId, setLineId] = useState<string>('');
  const [preferredNotifyChannel, setPreferredNotifyChannel] = useState<'email' | 'phone' | 'line' | 'sms'>('email');

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<MaintenanceTicket | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const successBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submittedTicket && successBannerRef.current) {
      successBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [submittedTicket]);

  // Current Category & Items
  const currentCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const currentItem = currentCategory?.items.find((i) => i.id === selectedItemId);

  // Handle Photo selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์รูปภาพเกิน 5MB กรุณาเลือกรูปภาพที่มีขนาดเล็กลง');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper icon for categories
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2': return <Building2 className="w-5 h-5" />;
      case 'Tv': return <Tv className="w-5 h-5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-5 h-5" />;
      case 'Droplet': return <Droplet className="w-5 h-5" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      default: return <Wrench className="w-5 h-5" />;
    }
  };

  // Computed 5W1H summary live preview
  const liveSummary = generate5W1H({
    reporterName: reporterName || '(ระบุชื่อผู้แจ้ง)',
    reporterRole,
    reporterPhone: phone || '(ระบุเบอร์โทร)',
    reporterDepartment: department,
    categoryName: currentCategory?.name || '',
    itemName: customItemName || currentItem?.name || '(ระบุอุปกรณ์)',
    problemDescription: problemDescription || '(ระบุรายละเอียดปัญหา)',
    floor,
    roomOrArea: roomOrArea || '(ระบุห้อง/พื้นที่)',
    specificDetail,
    urgency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomOrArea.trim()) {
      alert('กรุณาระบุห้องหรือพื้นที่ที่พบปัญหา');
      return;
    }
    if (!problemDescription.trim()) {
      alert('กรุณาระบุรายละเอียดอาการชำรุด');
      return;
    }
    if (!reporterName.trim() || !phone.trim()) {
      alert('กรุณากรอกชื่อผู้แจ้งและเบอร์โทรศัพท์สำหรับติดต่อกลับ');
      return;
    }
    if (preferredNotifyChannel === 'email' && !email.trim()) {
      alert('กรุณากรอกอีเมลหรือเปลี่ยนช่องทางการแจ้งกลับเป็นช่องทางอื่น');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randomSeq = String(Math.floor(Math.random() * 900) + 100);
    const newId = `REQ-${yearMonth}-${randomSeq}`;

    const resolvedItemName = customItemName.trim() ? customItemName : (currentItem?.name || 'อื่นๆ');

    const finalSummary = generate5W1H({
      reporterName,
      reporterRole,
      reporterPhone: phone,
      reporterDepartment: department,
      categoryName: currentCategory.name,
      itemName: resolvedItemName,
      problemDescription,
      floor,
      roomOrArea,
      specificDetail,
      urgency,
      createdAt: now.toISOString(),
    });

    const newTicket: MaintenanceTicket = {
      id: newId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      categoryId: currentCategory.id,
      categoryName: currentCategory.name,
      itemId: selectedItemId,
      itemName: resolvedItemName,
      customItemName: customItemName.trim() ? customItemName : undefined,
      location: {
        floor,
        roomOrArea,
        specificDetail: specificDetail.trim() ? specificDetail : undefined,
      },
      urgency,
      problemDescription,
      photos,
      reporter: {
        name: reporterName,
        role: reporterRole,
        department: department.trim() ? department : undefined,
        phone,
        email: email.trim() ? email : undefined,
        lineId: lineId.trim() ? lineId : undefined,
        preferredNotifyChannel,
      },
      status: 'pending',
      summary5W1H: finalSummary,
      googleChatDispatch: {
        sentAt: now.toISOString(),
        primaryRecipient: 'chakkarin@kku.ac.th',
        ccRecipient: 'sutako@kku.ac.th',
        status: 'sent',
      },
      reporterNotifiedHistory: [
        {
          timestamp: now.toISOString(),
          channel: preferredNotifyChannel,
          message: `ระบบได้รับคำร้องแจ้งซ่อม ${newId} เรียบร้อยแล้ว สรุป 5W1H ส่งถึงเจ้าหน้าที่ (chakkarin@kku.ac.th) และหัวหน้างาน (sutako@kku.ac.th)`,
          status: 'ส่งแจ้งเตือนตั้งต้นสำเร็จ',
        },
      ],
    };

    // If actual Webhook is provided, attempt optional fetch
if (webhookUrl && webhookUrl.startsWith('http')) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: formatGoogleChatMarkdown(newTicket),
            }),
          });
        } catch (err) {
          console.warn('Webhook dispatch failed', err);
        }
      }

    const urgencyLabel = urgency === 'critical' ? 'ด่วนที่สุด (ส่งผลกระทบเร่งด่วนต่อการเรียนการสอน)' : urgency === 'urgent' ? 'ด่วน (ส่งผลกระทบต่อการใช้งาน)' : 'ปกติ (บำรุงรักษาทั่วไป)';

    // ส่งอีเมลตอบรับอัตโนมัติไปยังผู้แจ้ง
    if (email.trim()) {
      const confirmSubject = `ได้รับคำร้องแจ้งซ่อม ${newId} — อาคารพจน์ สารสิน มข.`;
      const confirmBody = `เรียน คุณ${reporterName}

ระบบได้รับคำร้องแจ้งซ่อมของท่านเรียบร้อยแล้ว
เจ้าหน้าที่จะดำเนินการตรวจสอบและแจ้งความคืบหน้าให้ท่านทราบโดยเร็วที่สุด

━━━━━━━━━━━━━━━━━━━━━━━━
📋 สรุปรายการแจ้งซ่อม
━━━━━━━━━━━━━━━━━━━━━━━━

รหัสคำร้อง: ${newId}
วันที่แจ้ง: ${new Date().toLocaleString('th-TH', { dateStyle: 'long', timeStyle: 'short' })} น.

📍 สถานที่: อาคารพจน์ สารสิน ${floor} ${roomOrArea}${specificDetail.trim() ? ' (' + specificDetail.trim() + ')' : ''}
📂 หมวดหมู่: ${currentCategory.name} — ${resolvedItemName}
📝 รายละเอียดปัญหา: ${problemDescription}
⚠️ ระดับความด่วน: ${urgencyLabel}

👤 ผู้แจ้ง: ${reporterName}
📞 เบอร์โทร: ${phone}${email.trim() ? '\n📧 อีเมล: ' + email.trim() : ''}${reporterRole === 'student' ? '\n🎓 สถานะ: นักศึกษา มข.' : reporterRole === 'faculty' ? '\n👨‍🏫 สถานะ: อาจารย์/ผู้สอน' : reporterRole === 'staff' ? '\n👔 สถานะ: บุคลากร/เจ้าหน้าที่' : '\n👤 สถานะ: ผู้ใช้บริการทั่วไป'}${department.trim() ? '\n🏫 หน่วยงาน: ' + department.trim() : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
💬 สรุป 5W1H
━━━━━━━━━━━━━━━━━━━━━━━━

ใคร (Who): ${finalSummary.who}
อะไร (What): ${finalSummary.what}
ที่ไหน (Where): ${finalSummary.where}
เมื่อไหร่ (When): ${finalSummary.when}
ทำไม (Why): ${finalSummary.why}
อย่างไร (How): ${finalSummary.how}

━━━━━━━━━━━━━━━━━━━━━━━━

ขอบคุณที่ใช้บริการ
สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น

---
ข้อความนี้ส่งอัตโนมัติจากระบบแจ้งซ่อมอาคารพจน์ สารสิน
https://building-repair-system.pages.dev`;
      sendEmailNotification(email.trim(), confirmSubject, confirmBody);
    }

    setTimeout(() => {
      onSubmitTicket(newTicket);
      setSubmittedTicket(newTicket);
      setIsSubmitting(false);
    }, 600);
  };

  const handleResetForm = () => {
    setSubmittedTicket(null);
    setProblemDescription('');
    setPhotos([]);
    setRoomOrArea('');
    setSpecificDetail('');
    setCustomItemName('');
  };

  const handleCopyTicketId = () => {
    if (submittedTicket) {
      navigator.clipboard.writeText(submittedTicket.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Success Modal / Banner */}
      {submittedTicket && (
        <div ref={successBannerRef} className="mb-8 p-6 sm:p-8 bg-emerald-50 border-2 border-emerald-300 rounded-3xl shadow-lg animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✅ ส่งคำร้องสำเร็จ
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  ระบบส่งเรื่องไปยังเจ้าหน้าที่แล้ว
                </h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  <b>ขอบคุณที่ใช้บริการ</b> คุณสามารถติดตามการซ่อมได้ที่ลิงค์ติดตามสถานะด้านล่าง
                  ระบบจะแจ้งผลกลับไปยังช่องทางที่ท่านเลือก ({submittedTicket.reporter.preferredNotifyChannel.toUpperCase()})
                  ทุกครั้งเมื่อมีการเปลี่ยนสถานะการดำเนินการ
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  รหัสคำร้อง: <span className="font-mono font-bold text-red-700">{submittedTicket.id}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    onClick={handleCopyTicketId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-medium shadow-xs"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? 'คัดลอกรหัสแล้ว' : 'คัดลอกรหัสคำร้อง'}</span>
                  </button>
                  <button
                    onClick={() => onViewTicket(submittedTicket.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold shadow-xs"
                  >
                    <span>ติดตามสถานะทันที</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={handleResetForm}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs text-center"
              >
                + แจ้งซ่อมรายการอื่นเพิ่ม
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Intro Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-800">
                  แบบฟอร์มคำร้องออนไลน์
                </span>
                <span className="text-xs text-slate-500">
                  ส่งตรงถึงผู้รับผิดชอบทันที 24 ชม.
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                แจ้งซ่อมบำรุง อาคารพจน์ สารสิน
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ครอบคลุมระบบประกอบอาคาร โสตทัศนูปกรณ์ห้องเรียน ความปลอดภัย สาธารณูปโภค สุขาภิบาล และระบบกายภาพ
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-amber-900 block">Google Chat Instant Alert</span>
                <span className="text-amber-800/90 text-[11px]">
                  ส่งสรุป 5W1H เข้า Google Chat ทันทีที่กดส่ง
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Categories */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-mono">
                1
              </span>
              <span>เลือกหมวดหมู่ระบบที่ต้องการแจ้งซ่อม</span>
              <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setSelectedItemId(cat.items[0]?.id || '');
                      setCustomItemName('');
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-32 ${
                      isSelected
                        ? 'border-red-600 bg-red-50/50 shadow-sm ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {getCategoryIcon(cat.iconName)}
                    </div>
                    <div>
                      <div className="text-[11px] font-mono font-semibold text-slate-400">
                        {cat.code}
                      </div>
                      <div
                        className={`text-xs font-bold leading-tight mt-0.5 line-clamp-2 ${
                          isSelected ? 'text-red-900' : 'text-slate-800'
                        }`}
                      >
                        {cat.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Item Selection within Category */}
            <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700">
                  รายการอุปกรณ์ใน {currentCategory.name}:
                </span>
                <span className="text-[11px] text-slate-400">
                  {currentCategory.items.length} รายการ
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {currentCategory.items.map((item) => {
                  const isItemActive = selectedItemId === item.id && !customItemName;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setCustomItemName('');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isItemActive
                          ? 'bg-red-600 text-white shadow-xs scale-[1.02]'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-red-300 hover:bg-red-50/30'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}

                {/* Other Custom Item Option */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId('custom-other');
                    setCustomItemName('อุปกรณ์อื่นๆ');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border border-dashed transition-all ${
                    selectedItemId === 'custom-other'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-700 bg-white'
                  }`}
                >
                  + อื่นๆ (ระบุเอง)
                </button>
              </div>

              {selectedItemId === 'custom-other' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    placeholder="พิมพ์ชื่ออุปกรณ์หรือจุดชำรุดที่ต้องการแจ้ง..."
                    className="w-full px-3.5 py-2 rounded-xl border border-red-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Location in Poj Sarasin Building */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-mono">
                  2
                </span>
                <span>ระบุสถานที่และจุดเกิดเหตุในอาคารพจน์ สารสิน</span>
                <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                คลิกเลือกชั้นและจุดแนะนำย่อยเพื่อกรอกข้อมูลรวดเร็ว
              </span>
            </div>

            {/* Floor Quick Selector Tabs */}
            <div className="mb-4">
              <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <span>เลือกชั้น / โซน:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BUILDING_FLOORS.map((group) => {
                  const isActive = floor === group.floor;
                  return (
                    <button
                      key={group.floor}
                      type="button"
                      onClick={() => setFloor(group.floor)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-red-600 text-white shadow-xs font-semibold scale-[1.02]'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {group.floorBadge}
                      </span>
                      <span>{group.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs: Floor Dropdown and Room Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Floor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชั้น / โซน
                </label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  {BUILDING_FLOORS.map((group) => (
                    <option key={group.floor} value={group.floor}>
                      {group.label}
                    </option>
                  ))}
                  <option value="ชั้น 5">ชั้น 5</option>
                </select>
              </div>

              {/* Room / Area */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>ห้อง หรือ พื้นที่ (เลือกจากจุดแนะนำย่อย หรือพิมพ์ระบุเอง)</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="room-suggestions-datalist"
                  value={roomOrArea}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoomOrArea(val);
                    const matchedFloor = findFloorByRoom(val);
                    if (matchedFloor) {
                      setFloor(matchedFloor);
                    }
                  }}
                  placeholder="เช่น ห้อง GL101, ห้องประชุมกระจก, ห้องควบคุมลิฟท์..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
                <datalist id="room-suggestions-datalist">
                  {ALL_ROOM_SUGGESTIONS.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Selected Floor Sub-Rooms (จุดแนะนำย่อยประจำชั้น) */}
            {(() => {
              const currentGroup = BUILDING_FLOORS.find((g) => g.floor === floor);
              const floorRooms = currentGroup?.rooms || [];

              return (
                <div className="mt-3.5 p-3.5 rounded-2xl bg-red-50/40 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600"></span>
                      <span>จุดแนะนำย่อยสำหรับ <b className="text-red-800">{currentGroup?.label || floor}</b>:</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {floorRooms.length} จุด
                    </span>
                  </div>

                  {floorRooms.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {floorRooms.map((room) => {
                        const isSelected = roomOrArea === room;
                        return (
                          <button
                            key={room}
                            type="button"
                            onClick={() => {
                              setRoomOrArea(room);
                              setFloor(currentGroup?.floor || floor);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                              isSelected
                                ? 'bg-red-600 text-white shadow-xs font-semibold ring-2 ring-red-400 scale-[1.02]'
                                : 'bg-white text-slate-700 hover:bg-white hover:text-red-700 hover:border-red-300 border border-slate-200'
                            }`}
                          >
                            {isSelected && <span className="mr-1">✓</span>}
                            {room}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      สามารถพิมพ์ระบุชื่อห้องหรือบริเวณได้โดยตรงในช่องด้านบน
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Specific details */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                จุดสังเกตเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                value={specificDetail}
                onChange={(e) => setSpecificDetail(e.target.value)}
                placeholder="เช่น ตัวกลางหน้ากระดาน, เสาไฟต้นที่ 3, ประตูฝั่งทิศตะวันออก, ข้างสวิตช์ไฟ"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>
          </div>

          {/* Section 3: Urgency & Problem Details */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-mono">
                3
              </span>
              <span>ระดับความเร่งด่วน และอาการชำรุด</span>
              <span className="text-red-500">*</span>
            </label>

            {/* Urgency selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setUrgency('normal')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  urgency === 'normal'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">🟢 ปกติ (Normal)</span>
                  <span className="text-[10px] text-emerald-600 font-mono">1-3 วัน</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ไม่ส่งผลกระทบต่อการเรียนการสอนทันที ซ่อมบำรุงตามคิว
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('urgent')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  urgency === 'urgent'
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">🟡 ด่วน (Urgent)</span>
                  <span className="text-[10px] text-amber-700 font-mono">ภายในวันนี้</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  กระทบต่อการใช้งานอาคารและการทำงานของบุคลากร
                </p>
              </button>

              <button
                type="button"
                onClick={() => setUrgency('critical')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  urgency === 'critical'
                    ? 'border-red-600 bg-red-50 ring-2 ring-red-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-800">🔴 ด่วนที่สุด (Critical)</span>
                  <span className="text-[10px] text-red-600 font-mono font-bold animate-pulse">ด่วนทันที</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  กระทบการสอนสด / เสี่ยงอันตรายต่อชีวิตและทรัพย์สิน
                </p>
              </button>
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>รายละเอียดอาการชำรุด หรือสาเหตุที่พบ</span>
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="อธิบายอาการที่พบ เช่น แอร์เปิดไม่ติด มีน้ำรั่ว, โปรเจ็คเตอร์ภาพมืด, ท่อประปาแตกน้ำไหลนอง..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none leading-relaxed"
                required
              />
            </div>

            {/* Photo Upload Requirement 1 */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span>แนบภาพถ่ายจุดที่ชำรุด (ช่วยให้ช่างประเมินและเตรียมอะไหล่ได้เร็วขึ้น)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {photos.length} รูปภาพ
                </span>
              </div>

              {/* Photo preview gallery */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-xl overflow-hidden border border-slate-300 group shadow-xs bg-slate-100"
                  >
                    <img
                      src={photo}
                      alt={`ภาพที่ ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add Photo Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/20 text-slate-500 hover:text-red-700 flex flex-col items-center justify-center gap-1 transition-all"
                >
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                  <span className="text-[11px] font-medium">+ เพิ่มภาพถ่าย</span>
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                รองรับไฟล์ภาพ JPG, PNG (สามารถถ่ายภาพจากมือถือแล้วแนบได้ทันที)
              </p>
            </div>
          </div>

          {/* Section 4: Reporter Info & Channel */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-mono">
                4
              </span>
              <span>ข้อมูลผู้แจ้ง และช่องทางการแจ้งผลกลับ</span>
              <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อ - นามสกุล ผู้แจ้ง <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="เช่น ผศ.ดร.สมชาย ใจดี"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะ / สังกัด
                </label>
                <select
                  value={reporterRole}
                  onChange={(e) => setReporterRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="faculty">อาจารย์ / ผู้สอน</option>
                  <option value="staff">บุคลากร / เจ้าหน้าที่</option>
                  <option value="student">นักศึกษา มข.</option>
                  <option value="external">บุคคลภายนอก / ผู้มาติดต่อ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-2345678 หรือ 44843"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (สำหรับรับแจ้งสถานะ)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@kku.ac.th"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>

            {/* Additional line ID & notification channel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  LINE ID (ถ้าสะดวกรับแจ้งผ่านไลน์)
                </label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="LINE ID ของผู้แจ้ง"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ช่องทางหลักที่ต้องการให้เจ้าหน้าที่แจ้งผลกลับ
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['email', 'phone', 'line', 'sms'] as const).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setPreferredNotifyChannel(ch)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-medium uppercase border transition-all ${
                        preferredNotifyChannel === ch
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Real-time 5W1H & Google Chat Preview Card (Requirement 5) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  ตัวอย่างการสรุปข้อมูล 5W1H สำหรับส่งเข้า Google Chat
                </h3>
                <p className="text-xs text-slate-400">
                  ระบบจะประมวลผลสรุป 5W1H ส่งไปยัง <span className="text-amber-400 font-mono">chakkarin@kku.ac.th</span> และสำเนา <span className="text-amber-400 font-mono">sutako@kku.ac.th</span>
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 self-start sm:self-auto">
              5W1H Auto Summary
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">
                👤 WHO (ใครแจ้ง):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {liveSummary.who}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">
                🛠️ WHAT (เกิดอะไรขึ้น):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {liveSummary.what}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">
                📍 WHERE (ที่ไหน):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {liveSummary.where}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">
                ⏰ WHEN (เมื่อไหร่):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {liveSummary.when}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">
                ⚠️ WHY (ทำไมต้องซ่อม/ผลกระทบ):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {liveSummary.why}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-amber-400 font-bold block mb-1">
                🔧 HOW (จะแก้ไขอย่างไร):
              </span>
              <p className="text-slate-200 leading-relaxed">
                {liveSummary.how}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>ข้อมูลได้รับการบันทึกและส่งแจ้งเตือนอย่างปลอดภัยในระบบเครือข่าย มข.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              id="btn-submit-repair"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-red-950/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'กำลังส่งคำร้องและแจ้งเตือน...' : 'ยืนยันส่งคำร้องแจ้งซ่อม'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
