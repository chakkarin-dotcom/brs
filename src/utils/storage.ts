import { INITIAL_CATEGORIES, INITIAL_OFFICER, INITIAL_TICKETS } from '../data/initialData';
import { MaintenanceCategory, MaintenanceTicket, OfficerProfile, SystemRating, TicketStatus } from '../types';

const STORAGE_KEYS = {
  CATEGORIES: 'kku_pojsarasin_categories_v1',
  TICKETS: 'kku_pojsarasin_tickets_v1',
  OFFICER: 'kku_pojsarasin_officer_v1',
  WEBHOOK_URL: 'kku_pojsarasin_gchat_webhook_url_v1',
  SUPER_ADMIN_EMAILS: 'kku_pojsarasin_super_admin_emails_v1',
  SYSTEM_RATINGS: 'kku_pojsarasin_system_ratings_v1',
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeTicket(value: unknown, index: number): MaintenanceTicket {
  const ticket = asRecord(value);
  const location = asRecord(ticket.location);
  const reporter = asRecord(ticket.reporter);
  const summary = asRecord(ticket.summary5W1H);
  const legacyName = asString(ticket.reporterName, 'ไม่ระบุชื่อ');
  const legacyPhone = asString(ticket.phone);
  const reporterName = asString(reporter.name, legacyName);
  const reporterPhone = asString(reporter.phone, legacyPhone);
  const itemName = asString(ticket.itemName, 'ไม่ระบุรายการ');
  const problemDescription = asString(ticket.problemDescription, asString(ticket.detail));
  const floor = asString(location.floor, 'ไม่ระบุชั้น');
  const roomOrArea = asString(location.roomOrArea, 'ไม่ระบุพื้นที่');
  const createdAt = asString(ticket.createdAt, asString(ticket.updatedAt, new Date().toISOString()));
  const status = ticket.status;
  const validStatuses: TicketStatus[] = ['pending', 'in_progress', 'waiting_parts', 'completed', 'cancelled'];
  const reporterRole = reporter.role;
  const preferredNotifyChannel = reporter.preferredNotifyChannel;
  const statusSummary = {
    who: `${reporterName}${reporterPhone ? ` โทร ${reporterPhone}` : ''}`,
    what: `${itemName}${problemDescription ? `: ${problemDescription}` : ''}`,
    where: `${floor} ${roomOrArea}`,
    when: createdAt,
    why: problemDescription,
    how: asString(ticket.repairNotes, 'รอเจ้าหน้าที่ตรวจสอบ'),
  };

  return {
    ...ticket,
    id: asString(ticket.id, `LEGACY-${index + 1}`),
    createdAt,
    updatedAt: asString(ticket.updatedAt, createdAt),
    categoryId: asString(ticket.categoryId, 'legacy'),
    categoryName: asString(ticket.categoryName, 'ไม่ระบุหมวดหมู่'),
    itemId: asString(ticket.itemId, 'legacy'),
    itemName,
    location: {
      floor,
      roomOrArea,
      specificDetail: asString(location.specificDetail) || undefined,
    },
    urgency: ticket.urgency === 'urgent' || ticket.urgency === 'critical' ? ticket.urgency : 'normal',
    problemDescription,
    photos: Array.isArray(ticket.photos) ? ticket.photos.filter((photo): photo is string => typeof photo === 'string') : [],
    reporter: {
      name: reporterName,
      role: reporterRole === 'faculty' || reporterRole === 'staff' || reporterRole === 'student' || reporterRole === 'external' || reporterRole === 'other'
        ? reporterRole
        : 'other',
      department: asString(reporter.department, asString(ticket.department)) || undefined,
      phone: reporterPhone,
      email: asString(reporter.email, asString(ticket.email)) || undefined,
      lineId: asString(reporter.lineId, asString(ticket.lineId)) || undefined,
      preferredNotifyChannel: preferredNotifyChannel === 'phone' || preferredNotifyChannel === 'line' || preferredNotifyChannel === 'sms'
        ? preferredNotifyChannel
        : 'email',
    },
    status: validStatuses.includes(status as TicketStatus) ? status as TicketStatus : 'pending',
    summary5W1H: {
      who: asString(summary.who, statusSummary.who),
      what: asString(summary.what, statusSummary.what),
      where: asString(summary.where, statusSummary.where),
      when: asString(summary.when, statusSummary.when),
      why: asString(summary.why, statusSummary.why),
      how: asString(summary.how, statusSummary.how),
    },
    executiveDirectives: Array.isArray(ticket.executiveDirectives) ? ticket.executiveDirectives : [],
    reporterNotifiedHistory: Array.isArray(ticket.reporterNotifiedHistory) ? ticket.reporterNotifiedHistory : [],
  } as MaintenanceTicket;
}

function getScriptUrl(): string {
  try {
    // ชี้ปลายทางมาที่ Cloudflare Worker แทน Google Apps Script
    return (import.meta as any).env?.VITE_WORKER_API_URL || 'https://building-repair-api.chakkarin.workers.dev';
  } catch {
    return 'https://building-repair-api.chakkarin.workers.dev';
  }
}

export function isGoogleSheetsConfigured(): boolean {
  return !!getScriptUrl();
}

// ── Google Sheets API helpers ──

async function fetchFromSheets(key: string): Promise<string | null> {
  const url = getScriptUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}?key=${encodeURIComponent(key)}`);
    const json = await res.json();
    return json.data ?? null;
  } catch (e) {
    console.warn(`[Google Sheets] Failed to fetch "${key}":`, e);
    return null;
  }
}

async function writeToSheets(key: string, value: string, notify?: { email: string; subject: string; body: string }): Promise<void> {
  const url = getScriptUrl();
  if (!url) return;
  const body: any = { key, value };
  if (notify) {
    body.notifyEmail = notify.email;
    body.notifySubject = notify.subject;
    body.notifyBody = notify.body;
  }
  const raw = JSON.stringify(body);
  // XMLHttpRequest: ส่ง POST ข้าม origin ได้ (แม้ CORS block การอ่าน response, request ไปถึง server)
  // สำหรับ simple request (POST + text/plain) browser ไม่ส่ง preflight OPTIONS
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.send(raw);
  } catch (e) {
    console.warn(`[Google Sheets] Failed to write "${key}":`, e);
    // Fallback
    try { navigator.sendBeacon(url, raw); } catch {}
  }
}

export async function sendEmailNotification(email: string, subject: string, body: string): Promise<void> {
  await postNotification({
    key: '__email',
    value: '',
    notifyEmail: email,
    notifySubject: subject,
    notifyBody: body,
  });
}

export async function sendGoogleChatViaSheets(text: string): Promise<void> {
  await postNotification({ key: '__gchat', value: text });
}

async function postNotification(payload: Record<string, string>): Promise<void> {
  const response = await fetch(getScriptUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Notification service returned HTTP ${response.status}`);
  }

  const result = await response.json() as { success?: boolean; error?: string };
  if (!result.success) {
    throw new Error(result.error || 'Notification service did not confirm delivery');
  }
}

// ── Async sync from Google Sheets (call on app mount) ──

export async function syncCategoriesFromSheets(): Promise<MaintenanceCategory[] | null> {
  const raw = await fetchFromSheets('categories');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Also update localStorage cache
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, raw);
      return parsed as MaintenanceCategory[];
    }
  } catch { /* ignore */ }
  return null;
}

export async function syncTicketsFromSheets(): Promise<MaintenanceTicket[] | null> {
  const raw = await fetchFromSheets('tickets');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const tickets = parsed.map((ticket: unknown, index: number) => normalizeTicket(ticket, index));
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
      return tickets;
    }
  } catch { /* ignore */ }
  return null;
}

export async function syncOfficerFromSheets(): Promise<OfficerProfile | null> {
  const raw = await fetchFromSheets('officer');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name) {
      localStorage.setItem(STORAGE_KEYS.OFFICER, raw);
      return parsed as OfficerProfile;
    }
  } catch { /* ignore */ }
  return null;
}

export async function syncWebhookUrlFromSheets(): Promise<string | null> {
  // ยกเลิกการดึงและเก็บ Webhook URL ไว้ในเบราว์เซอร์เพื่อความปลอดภัย
  localStorage.removeItem(STORAGE_KEYS.WEBHOOK_URL);
  return null;
}

// ── Synchronous load (from localStorage, with fallback to initial data) ──

export function loadCategories(): MaintenanceCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading categories from localStorage', e);
  }
  return INITIAL_CATEGORIES;
}

export function saveCategories(categories: MaintenanceCategory[]) {
  try {
    const raw = JSON.stringify(categories);
    if (localStorage.getItem(STORAGE_KEYS.CATEGORIES) === raw) return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, raw);
    if (isGoogleSheetsConfigured()) {
      writeToSheets('categories', raw);
    }
  } catch (e) {
    console.error('Error saving categories', e);
  }
}

export function loadTickets(): MaintenanceTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const tickets = parsed.map((ticket: unknown, index: number) => normalizeTicket(ticket, index));
        const existingIds = new Set(tickets.map((ticket) => ticket.id));
        const missingInitials = INITIAL_TICKETS.filter((t) => !existingIds.has(t.id));

        let result = missingInitials.length > 0 ? [...tickets, ...missingInitials] : tickets;

        const hasAnyDirectives = result.some((ticket) => ticket.executiveDirectives && ticket.executiveDirectives.length > 0);
        if (!hasAnyDirectives) {
          result = result.map((ticket) => {
            const init = INITIAL_TICKETS.find((item) => item.id === ticket.id);
            return init?.executiveDirectives ? { ...ticket, executiveDirectives: init.executiveDirectives } : ticket;
          });
        }
        return result;
      }
    }
  } catch (e) {
    console.error('Error loading tickets from localStorage', e);
  }
  return INITIAL_TICKETS;
}

export function saveTickets(tickets: MaintenanceTicket[]) {
  try {
    const raw = JSON.stringify(tickets);
    const initRaw = JSON.stringify(INITIAL_TICKETS);
    const storedRaw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (storedRaw === raw) return;
    const hasData = storedRaw !== null;
    if (hasData && raw === initRaw) return;
    localStorage.setItem(STORAGE_KEYS.TICKETS, raw);
    // ห้ามเขียน INITIAL_TICKETS ทับ Sheet (กันข้อมูลผู้ใช้หาย)
    if (isGoogleSheetsConfigured() && raw !== initRaw) {
      writeToSheets('tickets', raw);
    }
  } catch (e) {
    console.error('Error saving tickets', e);
  }
}

export function loadOfficer(): OfficerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFICER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        // Migrate old photo URL to the new local image
        if (parsed.photoUrl && parsed.photoUrl.includes('lh3.googleusercontent.com')) {
          return { ...parsed, photoUrl: '/chakkarin2.jpg' };
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading officer profile', e);
  }
  return INITIAL_OFFICER;
}

export function saveOfficer(officer: OfficerProfile) {
  try {
    const raw = JSON.stringify(officer);
    if (localStorage.getItem(STORAGE_KEYS.OFFICER) === raw) return;
    localStorage.setItem(STORAGE_KEYS.OFFICER, raw);
    if (isGoogleSheetsConfigured()) {
      writeToSheets('officer', raw);
    }
  } catch (e) {
    console.error('Error saving officer', e);
  }
}

export function loadWebhookUrl(): string {
  return '';
}

export function saveWebhookUrl(url: string) {
  try {
    if (localStorage.getItem(STORAGE_KEYS.WEBHOOK_URL) === url) return;
    localStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, url);
    if (url && isGoogleSheetsConfigured()) {
      writeToSheets('webhookUrl', url);
    }
  } catch (e) {
    console.error('Error saving webhook URL', e);
  }
}

export function loadSuperAdminEmails(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return ['chakkarin@kku.ac.th'];
}

export function saveSuperAdminEmails(emails: string[]) {
  try {
    const raw = JSON.stringify(emails);
    if (localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS) === raw) return;
    localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS, raw);
    if (isGoogleSheetsConfigured()) {
      writeToSheets('superAdminEmails', raw);
    }
  } catch (e) {
    console.error('Error saving super admin emails', e);
  }
}

export async function syncSuperAdminEmailsFromSheets(): Promise<string[] | null> {
  const raw = await fetchFromSheets('superAdminEmails');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS, raw);
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export function loadSystemRatings(): SystemRating[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_RATINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as SystemRating[];
    }
  } catch { /* ignore */ }
  return [];
}

export function saveSystemRatings(ratings: SystemRating[]) {
  try {
    const raw = JSON.stringify(ratings);
    if (localStorage.getItem(STORAGE_KEYS.SYSTEM_RATINGS) === raw) return;
    localStorage.setItem(STORAGE_KEYS.SYSTEM_RATINGS, raw);
    if (isGoogleSheetsConfigured()) {
      writeToSheets('systemRatings', raw);
    }
  } catch (e) {
    console.error('Error saving system ratings', e);
  }
}

export async function syncSystemRatingsFromSheets(): Promise<SystemRating[] | null> {
  const raw = await fetchFromSheets('systemRatings');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_RATINGS, raw);
      return parsed as SystemRating[];
    }
  } catch { /* ignore */ }
  return null;
}

export function exportAllData(): string {
  const data: any = {};
  try {
    const t = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (t) data.tickets = JSON.parse(t);
    const c = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (c) data.categories = JSON.parse(c);
    const o = localStorage.getItem(STORAGE_KEYS.OFFICER);
    if (o) data.officer = JSON.parse(o);
    // ยกเลิกการส่งออก webhookUrl เพื่อความปลอดภัย
    const e = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS);
    if (e) data.superAdminEmails = JSON.parse(e);
    data.exportedAt = new Date().toISOString();
  } catch { /* ignore */ }
  return JSON.stringify(data, null, 2);
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.tickets && Array.isArray(data.tickets)) {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(data.tickets));
    }
    if (data.categories && Array.isArray(data.categories)) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories));
    }
    if (data.officer) {
      localStorage.setItem(STORAGE_KEYS.OFFICER, JSON.stringify(data.officer));
    }
    if (data.webhookUrl) {
      localStorage.setItem(STORAGE_KEYS.WEBHOOK_URL, data.webhookUrl);
    }
    if (data.superAdminEmails && Array.isArray(data.superAdminEmails)) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS, JSON.stringify(data.superAdminEmails));
    }
    return true;
  } catch { return false; }
}