import React, { useState } from 'react';
import { Star, X, Send, Check } from 'lucide-react';
import { SystemRating } from '../types';

interface SystemRatingModalProps {
  onSubmitRating: (rating: SystemRating) => void;
}

export const SystemRatingModal: React.FC<SystemRatingModalProps> = ({
  onSubmitRating,
}) => {
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    if (selectedStars < 1) return;
    const rating: SystemRating = {
      overall: selectedStars,
      comment: comment.trim() || undefined,
      ratedAt: new Date().toISOString(),
    };
    onSubmitRating(rating);
    setSubmitted(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedStars(0);
    setHoveredStars(0);
    setComment('');
    setSubmitted(false);
  };

  return (
    <>
      {/* Open button — placed inline where needed */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-medium text-xs transition-all"
      >
        <Star className="w-4 h-4 text-amber-500" />
        <span>ประเมินความพึงพอใจระบบภาพรวม</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">ขอบคุณสำหรับการประเมิน!</h3>
                <p className="text-xs text-slate-500">ความคิดเห็นของท่านมีค่าสำหรับการพัฒนาระบบต่อไป</p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium"
                >
                  ปิด
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Star className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">ประเมินความพึงพอใจระบบภาพรวม</h3>
                      <p className="text-[11px] text-slate-500">ช่วยเราพัฒนาบริการให้ดียิ่งขึ้น</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedStars(star)}
                      onMouseEnter={() => setHoveredStars(star)}
                      onMouseLeave={() => setHoveredStars(0)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        (hoveredStars || selectedStars) >= star
                          ? 'bg-amber-400 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400'
                      } flex items-center justify-center font-bold text-sm`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500">
                  {selectedStars >= 1 ? `${selectedStars} จาก 5 ดาว` : 'กรุณาเลือกคะแนน'}
                </p>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="ข้อเสนอแนะเพิ่มเติม (ถ้ามี)..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 resize-none focus:ring-2 focus:ring-amber-400 outline-none"
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={selectedStars < 1}
                  className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                    selectedStars < 1
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>ส่งผลประเมิน</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};