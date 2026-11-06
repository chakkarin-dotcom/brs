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
    const json = await res.json() as {
      data?: unknown;
      tickets?: unknown;
      result?: string;
      message?: string;
    };
    if (!res.ok || json.result === 'error') {
      throw new Error(json.message || `Google Sheets service returned HTTP ${res.status}`);
    }

    const value = json.data && typeof json.data === 'object' && !Array.isArray(json.data)
      ? (json.data as Record<string, unknown>)[key]
      : json.data ?? (key === 'tickets' ? json.tickets : undefined);
    if (value === undefined || value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch (e) {
    console.warn(`[Google Sheets] Failed to fetch "${key}":`, e);
    return null;
  }
}

async function writeToSheets(key: string, value: string, notify?: { email: string; subject: string; body: string }): Promise<void> {
  const url = getScriptUrl();
  if (!url) throw new Error('Google Sheets API URL is not configured');
  const body: Record<string, string> = { key, value };
  if (notify) {
    body.notifyEmail = notify.email;
    body.notifySubject = notify.subject;
    body.notifyBody = notify.body;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  });
  const responseText = await response.text();
  let result: { success?: boolean; result?: string; error?: string; message?: string };
  try {
    result = JSON.parse(responseText) as { success?: boolean; result?: string; error?: string; message?: string };
  } catch {
    throw new Error(`Google Sheets service returned an invalid response (HTTP ${response.status})`);
  }
  if (!response.ok) {
    throw new Error(result.error || result.message || `Google Sheets service returned HTTP ${response.status}`);
  }
  if (!result.success && result.result !== 'success') {
    throw new Error(result.error || result.message || `Google Sheets service did not confirm saving "${key}"`);
  }
}

function writeToSheetsInBackground(key: string, value: string): void {
  void writeToSheets(key, value).catch((error: unknown) => {
    console.error(`[Google Sheets] Failed to save "${key}":`, error);
  });
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
    if (Array.isArray(parsed)) {
      const tickets = parsed.map((ticket: unknown, index: number) => normalizeTicket(ticket, index));
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
      writeToSheetsInBackground('categories', raw);
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

let lastSuccessfullySavedTickets: string | null = null;
let pendingTicketsSave: { raw: string; promise: Promise<void> } | null = null;
let ticketsWriteQueue: Promise<void> = Promise.resolve();

export function saveTickets(tickets: MaintenanceTicket[]): Promise<void> {
  const raw = JSON.stringify(tickets);
  const initRaw = JSON.stringify(INITIAL_TICKETS);
  let storedRaw: string | null = null;
  try {
    storedRaw = localStorage.getItem(STORAGE_KEYS.TICKETS);
  } catch (error) {
    console.error('Unable to read tickets from localStorage; continuing with remote persistence', error);
  }
  const hasData = storedRaw !== null;
  if (hasData && raw === initRaw) return Promise.resolve();

  if (storedRaw !== raw) {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, raw);
    } catch (error) {
      console.error('Unable to cache tickets in localStorage; continuing with remote persistence', error);
      if (!isGoogleSheetsConfigured()) return Promise.reject(error);
    }
  }

  if (!isGoogleSheetsConfigured() || raw === initRaw || lastSuccessfullySavedTickets === raw) {
    return Promise.resolve();
  }
  if (pendingTicketsSave?.raw === raw) return pendingTicketsSave.promise;

  const promise = ticketsWriteQueue
    .catch(() => undefined)
    .then(() => writeToSheets('tickets', raw))
    .then(() => {
      lastSuccessfullySavedTickets = raw;
    })
    .finally(() => {
      if (pendingTicketsSave?.promise === promise) pendingTicketsSave = null;
    });
  ticketsWriteQueue = promise;
  pendingTicketsSave = { raw, promise };
  return promise;
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
      writeToSheetsInBackground('officer', raw);
    }
  } catch (e) {
    console.error('Error saving officer', e);
  }
}

export function loadWebhookUrl(): string {
  // Google Chat webhook URLs must never be read from browser storage.
  // Purge any stale value to avoid accidentally exposing sensitive credentials.
  try {
    localStorage.removeItem(STORAGE_KEYS.WEBHOOK_URL);
  } catch {
    // ignore cleanup failures; the value must never be surfaced to the UI
  }
  return '';
}

export function saveWebhookUrl(_url: string) {
  // Never persist the Google Chat webhook in the browser; this is a secret.
  try {
    localStorage.removeItem(STORAGE_KEYS.WEBHOOK_URL);
  } catch (e) {
    console.error('Error clearing webhook URL from localStorage', e);
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
      writeToSheetsInBackground('superAdminEmails', raw);
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
      writeToSheetsInBackground('systemRatings', raw);
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
    const r = localStorage.getItem(STORAGE_KEYS.SYSTEM_RATINGS);
    if (r) data.systemRatings = JSON.parse(r);
    // Never export the webhook URL to avoid leaking a secret.
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
    if (data.systemRatings && Array.isArray(data.systemRatings)) {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_RATINGS, JSON.stringify(data.systemRatings));
    }
    // Never restore a webhook URL from exported data; this must remain server-side only.
    if (data.webhookUrl) {
      localStorage.removeItem(STORAGE_KEYS.WEBHOOK_URL);
    }
    if (data.superAdminEmails && Array.isArray(data.superAdminEmails)) {
      localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_EMAILS, JSON.stringify(data.superAdminEmails));
    }
    return true;
  } catch { return false; }
}