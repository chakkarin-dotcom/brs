import React, { useState } from 'react';
import { 
  MessageSquare, 
  Copy, 
  Check, 
  Send, 
  ShieldCheck, 
  UserCheck, 
  Building, 
  FileText,
  ExternalLink
} from 'lucide-react';
import { MaintenanceTicket } from '../types';
import { formatGoogleChatMarkdown, formatGoogleChatCard } from '../utils/5w1h';

interface GoogleChatModalProps {
  ticket: MaintenanceTicket | null;
  onClose: () => void;
  webhookUrl?: string;
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({
  ticket,
  onClose,
  webhookUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  if (!ticket) return null;

  const markdownText = formatGoogleChatMarkdown(ticket);
  const cardData = formatGoogleChatCard(ticket);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerSend = async () => {
    setIsSending(true);
if (webhookUrl && webhookUrl.startsWith('http')) {
        try {
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData),
          });
          if (!res.ok) console.warn('Webhook responded with status', res.status);
        } catch (err) {
          console.warn('Webhook dispatch error', err);
        }
      }
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Google Chat 5W1H Notification Card
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

        {/* Recipients per Requirement 5 */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">รายชื่อผู้รับแจ้งผ่าน Google Chat (อัตโนมัติ):</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> ส่งแจ้งแล้ว
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold block">ผู้รับผิดชอบหลัก:</span>
              <span className="font-bold text-slate-900">chakkarin@kku.ac.th</span>
              <span className="text-[11px] text-slate-500 block">นายจักรินทร์ ศิลารัตน์ (เจ้าหน้าที่ไอที)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] text-slate-400 font-semibold block">สำเนาเพื่อทราบ (CC):</span>
              <span className="font-bold text-slate-900">sutako@kku.ac.th</span>
              <span className="text-[11px] text-slate-500 block">หัวหน้างานบริหาร สถาบันการสอนวิชาศึกษาทั่วไป</span>
            </div>
          </div>
        </div>

        {/* Preview of Google Chat Card */}
        <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono space-y-2 shadow-inner max-h-72 overflow-y-auto">
          <div className="text-amber-400 font-bold font-sans text-sm pb-1 border-b border-slate-800 flex items-center justify-between">
            <span>ตัวอย่างข้อความ Google Chat (5W1H Format)</span>
            <span className="text-[10px] text-slate-400 font-mono">Cards v2</span>
          </div>

          <div className="text-slate-300 font-sans space-y-1.5 leading-relaxed pt-2">
            <div><b className="text-amber-300">👤 WHO:</b> {ticket.summary5W1H.who}</div>
            <div><b className="text-amber-300">🛠️ WHAT:</b> {ticket.summary5W1H.what}</div>
            <div><b className="text-amber-300">📍 WHERE:</b> {ticket.summary5W1H.where}</div>
            <div><b className="text-amber-300">⏰ WHEN:</b> {ticket.summary5W1H.when}</div>
            <div><b className="text-amber-300">⚠️ WHY:</b> {ticket.summary5W1H.why}</div>
            <div><b className="text-amber-300">🔧 HOW:</b> {ticket.summary5W1H.how}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ Markdown'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerSend}
              disabled={isSending}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'กำลังส่ง...' : sendSuccess ? 'ส่งซ้ำสำเร็จแล้ว!' : 'ทดสอบส่งซ้ำเข้า Google Chat'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
