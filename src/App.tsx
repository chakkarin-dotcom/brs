/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  loadCategories,
  saveCategories,
  loadTickets,
  saveTickets,
  loadOfficer,
  saveOfficer,
  loadWebhookUrl,
  saveWebhookUrl,
  loadSuperAdminEmails,
  saveSuperAdminEmails,
  isGoogleSheetsConfigured,
  syncCategoriesFromSheets,
  syncTicketsFromSheets,
  syncOfficerFromSheets,
  syncWebhookUrlFromSheets,
  syncSuperAdminEmailsFromSheets,
} from './utils/storage';
import { MaintenanceCategory, MaintenanceTicket, OfficerProfile, TicketStatus, ExecutiveRole, ExecutiveDirective, SatisfactionRating, SystemRating } from './types';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OfficerCard } from './components/OfficerCard';
import { RepairForm } from './components/RepairForm';
import { TicketTracking } from './components/TicketTracking';
import { Dashboard } from './components/Dashboard';
import { ExecutiveView } from './components/ExecutiveView';
import { SuperAdminModal } from './components/SuperAdminModal';
import { GoogleChatModal } from './components/GoogleChatModal';
import { NotificationModal } from './components/NotificationModal';
import { SatisfactionRatingModal } from './components/SatisfactionRatingModal';
import { UserGuideModal } from './components/UserGuideModal';
import { buildStatusNotificationMessage, STATUS_LABEL_TH, AUTO_NOTIFY_STATUSES } from './utils/notificationTemplates';
import { sendEmailNotification } from './utils/storage';
import { 
  Wrench, 
  Search, 
  BarChart3, 
  Building2, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  PhoneCall,
  Sparkles,
  Award,
  Megaphone
} from 'lucide-react';

export default function App() {
  // Global States loaded from persistent storage
  const [categories, setCategories] = useState<MaintenanceCategory[]>(loadCategories);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(loadTickets);
  const [officer, setOfficer] = useState<OfficerProfile>(loadOfficer);
  const [webhookUrl, setWebhookUrl] = useState<string>(loadWebhookUrl);
  const [superAdminEmails, setSuperAdminEmails] = useState<string[]>(loadSuperAdminEmails);

  // UI Navigation States
  const [activeTab, setActiveTab] = useState<'form' | 'tracking' | 'dashboard' | 'executive'>('form');
  const [currentRole, setCurrentRole] = useState<ExecutiveRole>('staff');
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');

  // Modals
  const [googleChatTicket, setGoogleChatTicket] = useState<MaintenanceTicket | null>(null);
  const [notificationTicket, setNotificationTicket] = useState<MaintenanceTicket | null>(null);
  const [ratingTicket, setRatingTicket] = useState<MaintenanceTicket | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Sync state changes to localStorage
  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    saveTickets(tickets);
  }, [tickets]);

  useEffect(() => {
    saveOfficer(officer);
  }, [officer]);

  useEffect(() => {
    saveWebhookUrl(webhookUrl);
  }, [webhookUrl]);

  useEffect(() => {
    saveSuperAdminEmails(superAdminEmails);
  }, [superAdminEmails]);

  // Sync from Google Sheets on mount — ใช้ข้อมูลที่มากที่สุดเสมอ
  useEffect(() => {
    if (!isGoogleSheetsConfigured()) return;

    (async () => {
      // Tickets: sync ถ้า Sheets มีข้อมูลมากกว่า localStorage
      const localRaw = localStorage.getItem('kku_pojsarasin_tickets_v1');
      const syncedTickets = await syncTicketsFromSheets();
      if (syncedTickets && syncedTickets.length > 0) {
        let localCount = 0;
        try { localCount = localRaw ? JSON.parse(localRaw).length : 0; } catch {}
        if (localCount < syncedTickets.length) {
          localStorage.setItem('kku_pojsarasin_tickets_v1', JSON.stringify(syncedTickets));
          setTickets(syncedTickets);
        }
      }

      // Config (webhookUrl, superAdminEmails): always sync
      const syncedWebhookUrl = await syncWebhookUrlFromSheets();
      if (syncedWebhookUrl !== null && syncedWebhookUrl !== '') setWebhookUrl(syncedWebhookUrl);

      const syncedEmails = await syncSuperAdminEmailsFromSheets();
      if (syncedEmails) setSuperAdminEmails(syncedEmails);
    })();
  }, []);

  // Handlers
  const handleAddNewTicket = (newTicket: MaintenanceTicket) => {
    const updated = [newTicket, ...tickets];
    setTickets(updated);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: TicketStatus, notes?: string) => {
    const now = new Date();
    let notifiedTicketSnapshot: MaintenanceTicket | null = null;

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const nextTicket: MaintenanceTicket = {
          ...t,
          status: newStatus,
          updatedAt: now.toISOString(),
          completedAt: newStatus === 'completed' ? now.toISOString() : t.completedAt,
          repairNotes: notes || t.repairNotes,
        };

        // Requirement: แจ้งผู้ใช้งานโดยอัตโนมัติเมื่อสถานะเปลี่ยนเป็น
        // "อยู่ระหว่างดำเนินการ", "รออะไหล่/อุปกรณ์" หรือ "แล้วเสร็จ"
        if (AUTO_NOTIFY_STATUSES.includes(newStatus)) {
          const message = buildStatusNotificationMessage(nextTicket, newStatus);
          const history = nextTicket.reporterNotifiedHistory || [];
          nextTicket.reporterNotifiedHistory = [
            ...history,
            {
              timestamp: now.toISOString(),
              channel: nextTicket.reporter.preferredNotifyChannel,
              message,
              status: 'แจ้งอัตโนมัติ (ระบบ)',
            },
          ];
          notifiedTicketSnapshot = nextTicket;

          // ส่งอีเมลไปยังผู้แจ้งผ่าน Google Apps Script
          const subject = `แจ้งสถานะคำร้อง ${nextTicket.id} — ${STATUS_LABEL_TH[newStatus]}`;
          if (nextTicket.reporter.email) {
            sendEmailNotification(nextTicket.reporter.email, subject, message);
          }
        }

        return nextTicket;
      }
      return t;
    });

    setTickets(updated);
    saveTickets(updated);

    // เปิดแบบประเมินความพึงพอใจให้ผู้ใช้งานทันทีเมื่องานแล้วเสร็จ
    if (newStatus === 'completed' && notifiedTicketSnapshot) {
      setRatingTicket(notifiedTicketSnapshot);
    }
  };

  const handleSubmitRating = (ticketId: string, rating: SatisfactionRating) => {
    const updated = tickets.map((t) =>
      t.id === ticketId ? { ...t, satisfactionRating: rating } : t
    );
    setTickets(updated);
    saveTickets(updated);
  };

  const handleAddExecutiveDirective = (
    ticketId: string,
    directiveData: Omit<ExecutiveDirective, 'id' | 'createdAt' | 'ticketId'>,
    notifyGoogleChat: boolean
  ) => {
    const now = new Date();
    const newDirective: ExecutiveDirective = {
      ...directiveData,
      id: `DIR-${Date.now()}`,
      ticketId,
      createdAt: now.toISOString(),
      notifiedGoogleChat: notifyGoogleChat,
    };

    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const existingDirectives = t.executiveDirectives || [];
        return {
          ...t,
          executiveDirectives: [newDirective, ...existingDirectives],
          updatedAt: now.toISOString(),
        };
      }
      return t;
    });

    setTickets(updated);
    saveTickets(updated);

    // If Google Chat notification is requested and webhook is configured
    if (notifyGoogleChat && webhookUrl) {
      try {
        fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardsV2: [
              {
                cardId: `directive-${newDirective.id}`,
                card: {
                  header: {
                    title: `คำสั่งการ/ข้อคิดเห็นผู้บริหาร: ${newDirective.authorPosition}`,
                    subtitle: `ผู้สั่งการ: ${newDirective.authorName} (${newDirective.role === 'director' ? 'ผู้อำนวยการ' : 'รอง ผอ. ฝ่ายบริหาร'})`,
                    imageUrl: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
                    imageType: 'CIRCLE',
                  },
                  sections: [
                    {
                      header: 'รายละเอียดคำสั่งการและงานซ่อม',
                      widgets: [
                        {
                          decoratedText: {
                            topLabel: 'รหัสคำร้องซ่อม',
                            text: `<b>${ticketId}</b>`,
                          },
                        },
                        {
                          decoratedText: {
                            topLabel: 'ประเภทคำสั่งการ',
                            text: `<b>${newDirective.type}</b>`,
                          },
                        },
                        {
                          decoratedText: {
                            topLabel: 'ข้อความคำสั่งการ',
                            text: newDirective.content,
                            wrapText: true,
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          }),
        }).catch(() => {
          // Ignore network errors in sandboxed demo environment
        });
      } catch {
        // Safe catch
      }
    }
  };

  const handleSendNotification = (ticketId: string, channel: string, message: string) => {
    const now = new Date();
    const updated = tickets.map((t) => {
      if (t.id === ticketId) {
        const history = t.reporterNotifiedHistory || [];
        const nextTicket = {
          ...t,
          reporterNotifiedHistory: [
            ...history,
            {
              timestamp: now.toISOString(),
              channel,
              message,
              status: 'แจ้งแล้ว',
            },
          ],
        };

        // ส่งอีเมลผ่าน Google Apps Script
        if (channel === 'email' && t.reporter.email) {
          sendEmailNotification(
            t.reporter.email,
            `แจ้งความคืบหน้างานซ่อมอาคารพจน์ สารสิน ${ticketId}`,
            message
          );
        }

        return nextTicket;
      }
      return t;
    });
    setTickets(updated);
    saveTickets(updated);
  };

  const handleViewTicketFromForm = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('tracking');
  };

  // KPI Quick Summary for Hero
  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const completedCount = tickets.filter((t) => t.status === 'completed').length;
  const totalDirectivesCount = tickets.reduce((acc, t) => acc + (t.executiveDirectives?.length || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-red-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSuperAdmin={isSuperAdmin}
        setIsSuperAdmin={setIsSuperAdmin}
        openAdminModal={() => setIsAdminModalOpen(true)}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenGuide={() => setShowGuide(true)}
        superAdminEmails={superAdminEmails}
      />

      {/* Hero Welcome Bar */}
      <div className="bg-gradient-to-b from-red-900 via-slate-900 to-slate-900 text-white pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-red-950/40 relative overflow-hidden">
        {/* Background Subtle Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-800/80 border border-red-700/60 text-red-200 mb-3 shadow-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>อาคารพจน์ สารสิน | สถาบันการสอนวิชาศึกษาทั่วไป มหาวิทยาลัยขอนแก่น</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                ระบบบริหารจัดการและแจ้งซ่อมบำรุง
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                บริการแจ้งซ่อมระบบประกอบอาคาร โสตทัศนูปกรณ์ห้องเรียน ระบบความปลอดภัย สุขาภิบาล และกายภาพ พร้อมระบบสรุป 5W1H ส่งตรงถึง Google Chat เจ้าหน้าที่และคำสั่งการผู้บริหาร (ผอ. และ รอง ผอ.ฝ่ายบริหาร)
              </p>
            </div>

            {/* Quick Hero Metrics */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div 
                onClick={() => setActiveTab('tracking')}
                className="p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
              >
                <div className="text-[11px] text-slate-300 font-medium">รอรับเรื่อง</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5">
                  {pendingCount}
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('tracking')}
                className="p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
              >
                <div className="text-[11px] text-slate-300 font-medium">กำลังซ่อม</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-blue-400 mt-0.5">
                  {inProgressCount}
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('tracking')}
                className="p-3 sm:p-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
              >
                <div className="text-[11px] text-slate-300 font-medium">แล้วเสร็จ</div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                  {completedCount}
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('executive')}
                className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-600/30 hover:from-amber-500/30 hover:to-red-600/40 border border-amber-400/30 backdrop-blur-sm cursor-pointer transition-all hover:scale-105"
                title="คลิกเพื่อเปิดมุมมองผู้บริหาร (ผู้อำนวยการ / รอง ผอ. ฝ่ายบริหาร)"
              >
                <div className="text-[11px] text-amber-200 font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>คำสั่งการ ผอ./รอง</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-0.5 flex items-center gap-1">
                  <span>{totalDirectivesCount}</span>
                  <span className="text-[10px] text-amber-200 font-normal">ข้อสั่งการ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 flex-1 w-full space-y-8 z-20">
        {/* Requirement 7: Officer Card on Homepage */}
        <section aria-label="ข้อมูลเจ้าหน้าที่ผู้ดูแลระบบ">
          <OfficerCard
            officer={officer}
            onUpdateOfficer={setOfficer}
            isSuperAdmin={isSuperAdmin}
          />
        </section>

        {/* Tab 1: Repair Form */}
        {activeTab === 'form' && (
          <section aria-label="แบบฟอร์มแจ้งซ่อม">
            <RepairForm
              categories={categories}
              onSubmitTicket={handleAddNewTicket}
              onViewTicket={handleViewTicketFromForm}
              webhookUrl={webhookUrl}
            />
          </section>
        )}

        {/* Tab 2: Ticket Tracking */}
        {activeTab === 'tracking' && (
          <section aria-label="ติดตามสถานะคำร้อง">
            <TicketTracking
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
              onOpenNotifyModal={(ticket) => setNotificationTicket(ticket)}
              onOpenGoogleChatModal={(ticket) => setGoogleChatTicket(ticket)}
              onOpenRateModal={(ticket) => setRatingTicket(ticket)}
              onUpdateTicketStatus={handleUpdateTicketStatus}
              isSuperAdmin={isSuperAdmin}
              currentRole={currentRole}
              onAddDirective={handleAddExecutiveDirective}
            />
          </section>
        )}

        {/* Tab 3: Dashboard */}
        {activeTab === 'dashboard' && (
          <section aria-label="แดชบอร์ดสรุปผล">
            <Dashboard
              tickets={tickets}
              categories={categories}
              onSelectTicket={handleViewTicketFromForm}
            />
          </section>
        )}

        {/* Tab 4: Executive View (Director & Deputy Director of Administration) */}
        {activeTab === 'executive' && (
          <section aria-label="มุมมองผู้บริหาร สรุปและสั่งการ">
            <ExecutiveView
              tickets={tickets}
              currentRole={currentRole}
              setCurrentRole={setCurrentRole}
              onAddDirective={handleAddExecutiveDirective}
              onSelectTicket={(ticketId) => {
                setSelectedTicketId(ticketId);
                setActiveTab('tracking');
              }}
              onOpenGoogleChatModal={(ticket) => setGoogleChatTicket(ticket)}
            />
          </section>
        )}
      </main>

      {/* Super Admin Modal (Requirement: Full CRUD) */}
      <SuperAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        categories={categories}
        onUpdateCategories={setCategories}
        tickets={tickets}
        onUpdateTickets={setTickets}
        officer={officer}
        onUpdateOfficer={setOfficer}
        webhookUrl={webhookUrl}
        onUpdateWebhookUrl={setWebhookUrl}
        superAdminEmails={superAdminEmails}
        onUpdateSuperAdminEmails={setSuperAdminEmails}
      />

      {/* Google Chat 5W1H Modal (Requirement 5) */}
      <GoogleChatModal
        ticket={googleChatTicket}
        onClose={() => setGoogleChatTicket(null)}
        webhookUrl={webhookUrl}
      />

      {/* Notification to Reporter Modal (Requirement 3) */}
      <NotificationModal
        ticket={notificationTicket}
        onClose={() => setNotificationTicket(null)}
        onSendNotification={handleSendNotification}
      />

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />

      {/* Satisfaction Rating Modal (Part 5) */}
      <SatisfactionRatingModal
        ticket={ratingTicket}
        onClose={() => setRatingTicket(null)}
        onSubmitRating={handleSubmitRating}
      />

      {/* Footer (Requirement 8) */}
      <Footer />
    </div>
  );
}
