import React, { useState } from 'react';
import { Star, Zap, Wrench, Smile, ThumbsUp, CheckCircle2, Send } from 'lucide-react';
import { MaintenanceTicket, SatisfactionRating } from '../types';

interface SatisfactionRatingModalProps {
  ticket: MaintenanceTicket | null;
  onClose: () => void;
  onSubmitRating: (ticketId: string, rating: SatisfactionRating) => void;
}

interface RatingCriterion {
  key: 'speed' | 'quality' | 'equipment' | 'overall';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CRITERIA: RatingCriterion[] = [
  {
    key: 'quality',
    label: 'ด้านคุณภาพ',
    description: 'ความเรียบร้อย ความคงทน ของงานที่ซ่อมแซม',
    icon: <Wrench className="w-4 h-4 text-blue-500" />,
  },
  {
    key: 'speed',
    label: 'ด้านความรวดเร็ว',
    description: 'ระยะเวลาตั้งแต่แจ้งเรื่องจนช่างเข้าดำเนินการ',
    icon: <Zap className="w-4 h-4 text-amber-500" />,
  },
  {
    key: 'equipment',
    label: 'ด้านความพร้อมของเครื่องมือ',
    description: 'เครื่องมือ อะไหล่ และอุปกรณ์ที่ใช้ในการซ่อม',
    icon: <Smile className="w-4 h-4 text-emerald-500" />,
  },
  {
    key: 'overall',
    label: 'ความพึงพอใจภาพรวม',
    description: 'ความพึงพอใจต่อการให้บริการทั้งหมดในภาพรวม',
    icon: <ThumbsUp className="w-4 h-4 text-red-500" />,
  },
];

const StarPicker: React.FC<{
  value: number;
  onChange: (val: number) => void;
}> = ({ value, onChange }) => {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 focus:outline-none"
            aria-label={`${star} ดาว`}
          >
            <Star
              className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${
                filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};

export const SatisfactionRatingModal: React.FC<SatisfactionRatingModalProps> = ({
  ticket,
  onClose,
  onSubmitRating,
}) => {
  const [scores, setScores] = useState<Record<string, number>>({
    quality: 0,
    speed: 0,
    equipment: 0,
    overall: 0,
  });
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!ticket) return null;

  const allRated = CRITERIA.every((c) => scores[c.key] > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRated) return;

    const rating: SatisfactionRating = {
      quality: scores.quality,
      speed: scores.speed,
      equipment: scores.equipment,
      overall: scores.overall,
      comment: comment.trim() || undefined,
      ratedAt: new Date().toISOString(),
    };

    onSubmitRating(ticket.id, rating);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                ประเมินความพึงพอใจการให้บริการ
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

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          งานซ่อม <b className="text-slate-800">{ticket.itemName}</b> ({ticket.categoryName}) ได้ดำเนินการแล้วเสร็จ
          ขอความร่วมมือท่านประเมินความพึงพอใจในแต่ละด้าน เพื่อนำไปปรับปรุงคุณภาพการให้บริการต่อไป
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {CRITERIA.map((c) => (
            <div
              key={c.key}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{c.icon}</div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{c.label}</div>
                  <div className="text-[11px] text-slate-500">{c.description}</div>
                </div>
              </div>

              <StarPicker
                value={scores[c.key]}
                onChange={(val) => setScores((prev) => ({ ...prev, [c.key]: val }))}
              />
            </div>
          ))}

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ความคิดเห็นเพิ่มเติม (ไม่บังคับ)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="เล่าประสบการณ์การใช้บริการ หรือข้อเสนอแนะเพื่อปรับปรุงการให้บริการ..."
              className="w-full p-3 rounded-2xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-2">
            <div>
              {submitted && (
                <span className="text-emerald-700 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> ขอบคุณสำหรับการประเมิน
                </span>
              )}
              {!submitted && !allRated && (
                <span className="text-slate-400 text-[11px]">
                  กรุณาให้คะแนนครบทั้ง 4 ด้าน
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                ปิด
              </button>
              <button
                type="submit"
                disabled={!allRated}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งแบบประเมิน</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * แสดงผลคะแนนความพึงพอใจแบบอ่านอย่างเดียว (read-only) เช่นในหน้ารายละเอียดคำร้อง
 */
export const SatisfactionRatingDisplay: React.FC<{ rating: SatisfactionRating }> = ({
  rating,
}) => {
  const renderStars = (value: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            value >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
          }`}
        />
      ))}
    </div>
  );

  const rows: { label: string; value: number }[] = [
    { label: 'ด้านคุณภาพ', value: rating.quality },
    { label: 'ด้านความรวดเร็ว', value: rating.speed },
    { label: 'ด้านความพร้อมของเครื่องมือ', value: rating.equipment },
    { label: 'ความพึงพอใจภาพรวม', value: rating.overall },
  ];

  return (
    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          ผลการประเมินความพึงพอใจของผู้ใช้บริการ
        </span>
        <span className="text-[10px] text-emerald-700">
          {new Date(rating.ratedAt).toLocaleString('th-TH')} น.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between bg-white/70 rounded-lg px-2.5 py-1.5 border border-emerald-100">
            <span className="text-slate-700">{r.label}</span>
            {renderStars(r.value)}
          </div>
        ))}
      </div>

      {rating.comment && (
        <p className="text-emerald-800 leading-relaxed bg-white/70 p-2 rounded-lg border border-emerald-100 mt-1">
          "{rating.comment}"
        </p>
      )}
    </div>
  );
};
