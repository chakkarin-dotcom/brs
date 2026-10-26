import React, { useState } from 'react';
import { 
  Send, 
  Mail, 
  Phone, 
  MessageSquare, 
  Check, 
  Copy, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { MaintenanceTicket } from '../types';

interface NotificationModalProps {
  ticket: MaintenanceTicket | null;
  onClose: () => void;
  onSendNotification: (ticketId: string, channel: string, message: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  ticket,
  onClose,
  onSendNotification,
}) => {
  if (!ticket) return null;

  const [channel, setChannel] = useState<'email' | 'phone' | 'line' | 'sms'>(
    ticket.reporter.preferredNotifyChannel || 'email'
  );

  const defaultTemplates = {
    pending: `เรียน คุณ${ticket.reporter.name}, ทางสถาบันการสอนวิชาศึกษาทั่วไป มข. ได้รับคำร้องแจ้งซ่อม ${ticket.id} (${ticket.itemName}) แล้ว กำลังประสานงานช่างเข้าตรวจสอบจุดเกิดเหตุ`,
    in_progress: `เรียน คุณ${ticket.reporter.name}, งานแจ้งซ่อม ${ticket.id} (${ticket.itemName}) อาคารพจน์ สารสิน ขณะนี้ช่างกำลังเข้าดำเนินการซ่อมแซมหน้างาน`,
    waiting_parts: `เรียน คุณ${ticket.reporter.name}, งานแจ้งซ่อม ${ticket.id} อยู่ระหว่างการรออะไหล่/อุปกรณ์เพิ่มเติม จะเข้าดำเนินการทันทีเมื่อของมาถึง`,
    completed: `เรียน คุณ${ticket.reporter.name}, งานแจ้งซ่อม ${ticket.id} (${ticket.itemName}) ณ อาคารพจน์ สารสิน ${ticket.location.floor} ได้ดำเนินการซ่อมแซมและทดสอบเสร็จสิ้นเรียบร้อยแล้ว พร้อมให้ท่านใช้งานตามปกติ`,
    cancelled: `เรียน คุณ${ticket.reporter.name}, คำร้อง ${ticket.id} ถูกยกเลิก หากมีข้อสงสัยโปรดติดต่อ นายจักรินทร์ ศิลารัตน์ โทร 44843`,
  };

  const initialMsg = defaultTemplates[ticket.status] || defaultTemplates.in_progress;
  const [message, setMessage] = useState(initialMsg);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    onSendNotification(ticket.id, channel, message);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Direct actions
  const mailtoLink = `mailto:${ticket.reporter.email}?subject=แจ้งความคืบหน้างานซ่อมอาคารพจน์ สารสิน ${ticket.id}&body=${encodeURIComponent(message)}`;
  const telLink = `tel:${ticket.reporter.phone}`;
  const smsLink = `sms:${ticket.reporter.phone}?body=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <Send className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                แจ้งผลกลับผู้แจ้งเรื่อง (Notify Reporter)
              </h3>
              <p className="text-xs text-slate-500">
                รหัสคำร้อง: <b className="font-mono text-red-700">{ticket.id}</b>
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

        {/* Reporter Info Card */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">ผู้รับการแจ้ง:</span>
              <span className="font-bold text-slate-900">{ticket.reporter.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">ช่องทางที่ผู้แจ้งต้องการ:</span>
              <span className="font-bold text-red-700 uppercase">{ticket.reporter.preferredNotifyChannel}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">เบอร์โทรศัพท์:</span>
              <span className="text-slate-800 font-mono">{ticket.reporter.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">อีเมล:</span>
              <span className="text-slate-800 truncate block">{ticket.reporter.email || '-'}</span>
            </div>
          </div>
        </div>

        {/* Select Channel */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            เลือกช่องทางส่งข้อความ
          </label>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                channel === 'email' ? 'border-red-600 bg-red-50 text-red-800 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('phone')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                channel === 'phone' ? 'border-red-600 bg-red-50 text-red-800 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Phone</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('line')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                channel === 'line' ? 'border-red-600 bg-red-50 text-red-800 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>LINE</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`p-2 rounded-xl border flex flex-col items-center gap-1 font-medium transition-all ${
                channel === 'sms' ? 'border-red-600 bg-red-50 text-red-800 font-bold' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>SMS</span>
            </button>
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="mt-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">ข้อความที่จะส่งแจ้ง:</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-red-500 outline-none leading-relaxed"
              required
            />
          </div>

          {/* Quick External Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
            {channel === 'email' && ticket.reporter.email && (
              <a
                href={mailtoLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-medium"
              >
                <Mail className="w-3 h-3" />
                <span>เปิดส่งผ่านโปรแกรมอีเมล (Outlook/Gmail)</span>
              </a>
            )}
            {channel === 'phone' && (
              <a
                href={telLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium"
              >
                <Phone className="w-3 h-3" />
                <span>กดโทรหาผู้แจ้งทันที</span>
              </a>
            )}
            {channel === 'sms' && (
              <a
                href={smsLink}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-medium"
              >
                <Send className="w-3 h-3" />
                <span>เปิดแอป SMS</span>
              </a>
            )}
            {channel === 'line' && (
              <>
                {ticket.reporter.lineId && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 border border-green-200 font-medium">
                    <MessageSquare className="w-3 h-3" />
                    <span>LINE ID: {ticket.reporter.lineId}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`ถึง ${ticket.reporter.name} (${ticket.reporter.lineId || '-'}): ${message}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white border border-green-600 font-medium"
                >
                  <Copy className="w-3 h-3" />
                  <span>คัดลอกข้อความส่ง LINE</span>
                </button>
              </>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
            <div>
              {sentSuccess && (
                <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> บันทึกและส่งแจ้งกลับสำเร็จแล้ว
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>บันทึกและส่งข้อความ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
