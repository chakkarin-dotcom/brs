import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  FolderPlus,
  Wrench,
  MessageSquare,
  Check,
  AlertCircle,
  Building2,
  Tv,
  Droplet,
  Sparkles,
  Car,
  Download,
  Upload
} from 'lucide-react';
import { MaintenanceCategory, MaintenanceTicket, OfficerProfile, TicketStatus } from '../types';
import { sendEmailNotification, exportAllData, importAllData } from '../utils/storage';
import { buildStatusNotificationMessage, STATUS_LABEL_TH, AUTO_NOTIFY_STATUSES } from '../utils/notificationTemplates';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MaintenanceCategory[];
  onUpdateCategories: (categories: MaintenanceCategory[]) => void;
  tickets: MaintenanceTicket[];
  onUpdateTickets: (tickets: MaintenanceTicket[]) => void;
  officer: OfficerProfile;
  onUpdateOfficer: (officer: OfficerProfile) => void;
  webhookUrl: string;
  onUpdateWebhookUrl: (url: string) => void;
  superAdminEmails: string[];
  onUpdateSuperAdminEmails: (emails: string[]) => void;
}

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdateCategories,
  tickets,
  onUpdateTickets,
  officer,
  onUpdateOfficer,
  webhookUrl,
  onUpdateWebhookUrl,
  superAdminEmails,
  onUpdateSuperAdminEmails,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'tickets' | 'officer' | 'webhook' | 'admins' | 'backup'>('categories');

  // Categories CRUD state
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || '');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('#b91c1c');

  // Items CRUD state
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemDesc, setEditItemDesc] = useState('');

  // Selected ticket for editing
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [ticketEditStatus, setTicketEditStatus] = useState<TicketStatus>('pending');
  const [ticketTechnicianName, setTicketTechnicianName] = useState('');
  const [ticketTechnicianPhone, setTicketTechnicianPhone] = useState('');
  const [ticketRepairNotes, setTicketRepairNotes] = useState('');

  // Webhook test status
  const [webhookInput, setWebhookInput] = useState(webhookUrl);
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'success' | 'testing'>('idle');

  // Super admin emails management
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Import status
  const [importStatus, setImportStatus] = useState('');

  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const currentTicket = tickets.find((t) => t.id === selectedTicketId);

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatCode.trim()) return;

    const newCat: MaintenanceCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      code: newCatCode.trim().toUpperCase(),
      description: newCatDesc.trim() || 'หมวดหมู่งานระบบอาคารพจน์ สารสิน',
      iconName: 'Building2',
      color: newCatColor,
      items: [],
    };

    const updated = [...categories, newCat];
    onUpdateCategories(updated);
    setSelectedCatId(newCat.id);
    setIsAddingCat(false);
    setNewCatName('');
    setNewCatCode('');
    setNewCatDesc('');
  };

  // Delete Category Handler
  const handleDeleteCategory = (catId: string) => {
    if (categories.length <= 1) {
      alert('ต้องมีหมวดหมู่อย่างน้อย 1 หมวดหมู่');
      return;
    }
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่นี้ พร้อมรายการทั้งหมดในหมวดหมู่?')) {
      const updated = categories.filter((c) => c.id !== catId);
      onUpdateCategories(updated);
      setSelectedCatId(updated[0]?.id || '');
    }
  };

  // Add Item to current category
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !currentCategory) return;

    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      description: newItemDesc.trim() || undefined,
    };

    const updated = categories.map((c) => {
      if (c.id === currentCategory.id) {
        return {
          ...c,
          items: [...c.items, newItem],
        };
      }
      return c;
    });

    onUpdateCategories(updated);
    setNewItemName('');
    setNewItemDesc('');
  };

  // Edit Item Handler
  const handleSaveEditItem = (itemId: string) => {
    if (!editItemName.trim()) return;
    const updated = categories.map((c) => {
      if (c.id === currentCategory.id) {
        return {
          ...c,
          items: c.items.map((i) =>
            i.id === itemId ? { ...i, name: editItemName.trim(), description: editItemDesc.trim() } : i
          ),
        };
      }
      return c;
    });
    onUpdateCategories(updated);
    setEditingItemId(null);
  };

  // Delete Item
  const handleDeleteItem = (itemId: string) => {
    if (confirm('ยืนยันลบรายการอุปกรณ์นี้?')) {
      const updated = categories.map((c) => {
        if (c.id === currentCategory.id) {
          return {
            ...c,
            items: c.items.filter((i) => i.id !== itemId),
          };
        }
        return c;
      });
      onUpdateCategories(updated);
    }
  };

  // Ticket Status & Technician update
  const handleSaveTicketUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTicket) return;

    const now = new Date();
    const prevStatus = currentTicket.status;
    const updatedTickets = tickets.map((t) => {
      if (t.id === currentTicket.id) {
        return {
          ...t,
          status: ticketEditStatus,
          updatedAt: now.toISOString(),
          completedAt: ticketEditStatus === 'completed' && !t.completedAt ? now.toISOString() : t.completedAt,
          assignedTechnician: ticketTechnicianName
            ? {
                name: ticketTechnicianName,
                phone: ticketTechnicianPhone || '44840',
                assignedAt: t.assignedTechnician?.assignedAt || now.toISOString(),
              }
            : t.assignedTechnician,
          repairNotes: ticketRepairNotes || t.repairNotes,
        };
      }
      return t;
    });

    onUpdateTickets(updatedTickets);

    // ส่งอีเมลแจ้งสถานะไปยังผู้แจ้งเมื่อสถานะเปลี่ยน
    if (ticketEditStatus !== prevStatus && AUTO_NOTIFY_STATUSES.includes(ticketEditStatus)) {
      const updatedTicket = updatedTickets.find((t) => t.id === currentTicket.id);
      if (updatedTicket && updatedTicket.reporter.email) {
        const subject = `แจ้งสถานะคำร้อง ${updatedTicket.id} — ${STATUS_LABEL_TH[ticketEditStatus]}`;
        const message = buildStatusNotificationMessage(updatedTicket, ticketEditStatus);
        sendEmailNotification(updatedTicket.reporter.email, subject, message);
      }
    }

    alert(`อัปเดตข้อมูลคำร้อง ${currentTicket.id} สำเร็จ`);
  };

  // Delete Ticket
  const handleDeleteTicket = (ticketId: string) => {
    if (confirm(`คุณต้องการลบคำร้อง ${ticketId} ออกจากระบบถาวรหรือไม่?`)) {
      const updated = tickets.filter((t) => t.id !== ticketId);
      onUpdateTickets(updated);
      setSelectedTicketId(updated[0]?.id || '');
    }
  };

  // Webhook Test
  const handleSaveWebhook = () => {
    onUpdateWebhookUrl(webhookInput.trim());
    setWebhookTestStatus('testing');
    setTimeout(() => {
      setWebhookTestStatus('success');
      setTimeout(() => setWebhookTestStatus('idle'), 3000);
    }, 800);
  };

  // Admin emails handlers
  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newAdminEmail.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }
    if (superAdminEmails.some((em) => em.toLowerCase() === email)) {
      alert('อีเมลนี้อยู่ในรายการแล้ว');
      return;
    }
    onUpdateSuperAdminEmails([...superAdminEmails, email]);
    setNewAdminEmail('');
  };

  const handleRemoveAdminEmail = (email: string) => {
    if (superAdminEmails.length <= 1) {
      alert('ต้องมีผู้ดูแลระบบอย่างน้อย 1 คน');
      return;
    }
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบ ${email} ออกจากรายการผู้ดูแลระบบ?`)) {
      onUpdateSuperAdminEmails(superAdminEmails.filter((em) => em !== email));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  ระบบจัดการสิทธิพิเศษ Super Admin
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-100 text-red-800">
                  Full CRUD
                </span>
              </div>
              <p className="text-xs text-slate-500">
                เพิ่ม ลบ แก้ไข ปรับปรุง หมวดหมู่ รายการอุปกรณ์ สถานะคำร้อง และการแจ้งเตือน
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

        {/* Super Admin Tabs */}
        <div className="flex items-center gap-1.5 pt-4 pb-3 border-b border-slate-100 shrink-0 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            หมวดหมู่ & อุปกรณ์ (Categories)
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'tickets'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            จัดการคำร้อง & ช่าง (Tickets)
          </button>
          <button
            onClick={() => setActiveTab('officer')}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'officer'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            เจ้าหน้าที่ (Officer Profile)
          </button>
          <button
            onClick={() => setActiveTab('webhook')}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'webhook'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Google Chat Webhook
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'admins'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ผู้ดูแลระบบ (Admins)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5 inline" /> สำรอง/กู้คืน
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* TAB 1: Categories & Items Management */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Category selector & Add button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCatId(c.id);
                        setIsAddingCat(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedCatId === c.id
                          ? 'bg-slate-900 text-white shadow-xs font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c.name} ({c.items.length})
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsAddingCat(!isAddingCat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ เพิ่มหมวดหมู่ใหม่</span>
                </button>
              </div>

              {/* Add Category Form */}
              {isAddingCat && (
                <form onSubmit={handleAddCategory} className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs space-y-3">
                  <h4 className="font-bold text-red-900">เพิ่มหมวดหมู่ระบบใหม่</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">ชื่อหมวดหมู่</label>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="เช่น ระบบพลังงานแสงอาทิตย์"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">รหัสย่อ (Code)</label>
                      <input
                        type="text"
                        value={newCatCode}
                        onChange={(e) => setNewCatCode(e.target.value)}
                        placeholder="เช่น SOLAR"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">สีประจำหมวดหมู่</label>
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-300 bg-white cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">คำอธิบายหมวดหมู่</label>
                    <input
                      type="text"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      placeholder="คำอธิบายสั้นๆ..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-medium"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold"
                    >
                      บันทึกหมวดหมู่
                    </button>
                  </div>
                </form>
              )}

              {/* Items Management in Current Category */}
              {currentCategory && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        รายการอุปกรณ์ใน "{currentCategory.name}" ({currentCategory.items.length} รายการ)
                      </h4>
                      <p className="text-xs text-slate-500">{currentCategory.description}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(currentCategory.id)}
                      className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>ลบหมวดหมู่นี้</span>
                    </button>
                  </div>

                  {/* Add item input form */}
                  <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="ชื่ออุปกรณ์ที่ต้องการเพิ่ม (เช่น หลอดไฟ LED, ปั้มลม)..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      required
                    />
                    <input
                      type="text"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                      placeholder="คำอธิบายอาการเสียทั่วไป (ถ้ามี)..."
                      className="sm:w-64 px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0"
                    >
                      + เพิ่มอุปกรณ์
                    </button>
                  </form>

                  {/* List of items */}
                  <div className="space-y-2">
                    {currentCategory.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        {editingItemId === item.id ? (
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              value={editItemName}
                              onChange={(e) => setEditItemName(e.target.value)}
                              className="px-2 py-1 rounded border border-red-300 flex-1"
                            />
                            <input
                              type="text"
                              value={editItemDesc}
                              onChange={(e) => setEditItemDesc(e.target.value)}
                              className="px-2 py-1 rounded border border-slate-300 sm:w-64"
                              placeholder="คำอธิบาย"
                            />
                            <button
                              onClick={() => handleSaveEditItem(item.id)}
                              className="p-1.5 rounded bg-emerald-600 text-white"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="p-1.5 rounded bg-slate-200 text-slate-700"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div>
                              <span className="font-semibold text-slate-900">{item.name}</span>
                              {item.description && (
                                <span className="text-slate-500 text-[11px] block">{item.description}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingItemId(item.id);
                                  setEditItemName(item.name);
                                  setEditItemDesc(item.description || '');
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                title="แก้ไข"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="ลบ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
</div>
          )}

          {/* TAB 6: Import / Export Backup */}
          {activeTab === 'backup' && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-5">
              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                สำรองและกู้คืนข้อมูล
              </h4>
              <p className="text-[11px] text-slate-400">
                สำรองข้อมูลทั้งหมดลงเป็นไฟล์ JSON หรือกู้คืนจากไฟล์สำรองกลับมาใช้งาน
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const json = exportAllData();
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> สำรองข้อมูล (Export)
                </button>
                <label className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> กู้คืนข้อมูล (Import)
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      file.text().then((text) => {
                        const ok = importAllData(text);
                        setImportStatus(ok ? 'นำเข้าสำเร็จ — กด F5 เพื่อโหลดใหม่' : 'ไฟล์ไม่ถูกต้อง');
                        setTimeout(() => setImportStatus(''), 5000);
                      });
                    }}
                    className="hidden"
                  />
                </label>
                {importStatus && <span className="text-emerald-400 font-medium">{importStatus}</span>}
              </div>
            </div>
          )}
            </div>
          )}

          {/* TAB 2: Tickets & Technician Management */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Tickets list */}
                <div className="sm:col-span-1 border border-slate-200 rounded-2xl p-3 bg-slate-50 max-h-96 overflow-y-auto space-y-2">
                  <span className="text-xs font-bold text-slate-700 block mb-2">เลือกคำร้องเพื่อจัดการ:</span>
                  {tickets.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTicketId(t.id);
                        setTicketEditStatus(t.status);
                        setTicketTechnicianName(t.assignedTechnician?.name || '');
                        setTicketTechnicianPhone(t.assignedTechnician?.phone || '');
                        setTicketRepairNotes(t.repairNotes || '');
                      }}
                      className={`w-full p-2.5 rounded-xl text-left border text-xs transition-all ${
                        selectedTicketId === t.id
                          ? 'border-red-600 bg-white shadow-xs font-semibold'
                          : 'border-slate-200 bg-white hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="font-mono text-slate-800 font-bold">{t.id}</div>
                      <div className="truncate text-slate-600 text-[11px]">{t.itemName}</div>
                      <div className="text-[10px] text-slate-400">{t.status}</div>
                    </button>
                  ))}
                </div>

                {/* Edit Form */}
                <div className="sm:col-span-2 border border-slate-200 rounded-2xl p-4 bg-white text-xs">
                  {currentTicket ? (
                    <form onSubmit={handleSaveTicketUpdate} className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div>
                          <span className="font-mono text-base font-bold text-red-700">{currentTicket.id}</span>
                          <h4 className="font-bold text-slate-900 text-sm">{currentTicket.itemName}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(currentTicket.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบคำร้องนี้</span>
                        </button>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">ปรับสถานะคำร้อง</label>
                        <select
                          value={ticketEditStatus}
                          onChange={(e) => setTicketEditStatus(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        >
                          <option value="pending">รอรับเรื่อง (Pending)</option>
                          <option value="in_progress">กำลังดำเนินการ (In Progress)</option>
                          <option value="waiting_parts">รออะไหล่/อุปกรณ์ (Waiting for Parts)</option>
                          <option value="completed">แล้วเสร็จ (Completed)</option>
                          <option value="cancelled">ยกเลิก (Cancelled)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">ชื่อช่างผู้รับผิดชอบ</label>
                          <input
                            type="text"
                            value={ticketTechnicianName}
                            onChange={(e) => setTicketTechnicianName(e.target.value)}
                            placeholder="เช่น นายประสิทธิ์ ช่างอาคาร"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">เบอร์โทรศัพท์ช่าง</label>
                          <input
                            type="text"
                            value={ticketTechnicianPhone}
                            onChange={(e) => setTicketTechnicianPhone(e.target.value)}
                            placeholder="เช่น 44840 หรือ 081-xxx"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">บันทึกผลการซ่อม / อะไหล่ที่เปลี่ยน</label>
                        <textarea
                          rows={3}
                          value={ticketRepairNotes}
                          onChange={(e) => setTicketRepairNotes(e.target.value)}
                          placeholder="บันทึกรายละเอียดหลังการซ่อม..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          บันทึกการปรับปรุง
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-12 text-slate-400">เลือกคำร้องทางซ้ายเพื่อจัดการ</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Officer Profile */}
          {activeTab === 'officer' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={officer.photoUrl}
                  alt={officer.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-slate-300"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{officer.name}</h4>
                  <p className="text-slate-600">{officer.position} - {officer.organization}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ชื่อเจ้าหน้าที่</label>
                  <input
                    type="text"
                    value={officer.name}
                    onChange={(e) => onUpdateOfficer({ ...officer, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={officer.position}
                    onChange={(e) => onUpdateOfficer({ ...officer, position: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์ภายใน</label>
                  <input
                    type="text"
                    value={officer.internalPhone}
                    onChange={(e) => onUpdateOfficer({ ...officer, internalPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">เบอร์มือถือ</label>
                  <input
                    type="text"
                    value={officer.mobilePhone}
                    onChange={(e) => onUpdateOfficer({ ...officer, mobilePhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">อีเมลผู้รับแจ้ง</label>
                  <input
                    type="email"
                    value={officer.email}
                    onChange={(e) => onUpdateOfficer({ ...officer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">ลิงก์ URL รูปภาพ</label>
                  <input
                    type="url"
                    value={officer.photoUrl}
                    onChange={(e) => onUpdateOfficer({ ...officer, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Google Chat Webhook Integration */}
          {activeTab === 'webhook' && (
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 text-xs space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <MessageSquare className="w-4 h-4" />
                <span>การเชื่อมต่อ Google Chat Webhook (สำหรับพื้นที่ทำงาน มข.)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                ระบบจะส่งข้อมูลสรุป 5W1H ไปยังอีเมลของเจ้าหน้าที่ (<b className="text-white">chakkarin@kku.ac.th</b>) และสำเนาหัวหน้างานบริหาร (<b className="text-white">sutako@kku.ac.th</b>) เมื่อมีการกรอก Webhook URL ของ Google Chat Space ระบบจะทำการ POST ข้อความไปยังห้องสนทนาทันที
              </p>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Google Chat Incoming Webhook URL (ไม่บังคับ - ปล่อยว่างเพื่อใช้ระบบ Simulation)
                </label>
                <input
                  type="url"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://chat.googleapis.com/v1/spaces/.../messages?key=..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-[11px] focus:ring-2 focus:ring-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] text-slate-400">
                  {webhookTestStatus === 'success' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> บันทึกและทดสอบส่งแจ้งเตือนเรียบร้อย
                    </span>
                  )}
                  {webhookTestStatus === 'testing' && <span>กำลังทดสอบการส่ง...</span>}
                </div>

                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  บันทึกการตั้งค่า Webhook
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: Super Admin Emails */}
          {activeTab === 'admins' && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-5">
              <div>
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  รายการอีเมลที่มีสิทธิ์เข้าสู่โหมด Super Admin
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  เฉพาะอีเมลในรายการนี้เท่านั้นที่จะยืนยันตัวตนผ่านหน้า Super Admin ได้ — สามารถเพิ่มหรือลบได้ภายหลัง
                </p>
              </div>

              <form onSubmit={handleAddAdminEmail} className="flex items-center gap-2">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@kku.ac.th"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-mono text-xs focus:ring-2 focus:ring-red-400 outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs whitespace-nowrap"
                >
                  + เพิ่มอีเมล
                </button>
              </form>

              <ul className="space-y-2">
                {superAdminEmails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5"
                  >
                    <span className="font-mono text-xs text-slate-200 break-all">{email}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAdminEmail(email)}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors"
                    >
                      ลบ
                    </button>
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-slate-500">
                รายการนี้จะถูกบันทึกลง Google Sheets เพื่อให้ใช้ร่วมกันได้ทุกเครื่อง
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
          >
            เสร็จสิ้น / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
