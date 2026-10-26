import { INITIAL_CATEGORIES, INITIAL_OFFICER, INITIAL_TICKETS } from '../data/initialData';
import { MaintenanceCategory, MaintenanceTicket, OfficerProfile, SystemRating } from '../types';

const STORAGE_KEYS = {
  CATEGORIES: 'kku_pojsarasin_categories_v1',
  TICKETS: 'kku_pojsarasin_tickets_v1',
  OFFICER: 'kku_pojsarasin_officer_v1',
  WEBHOOK_URL: 'kku_pojsarasin_gchat_webhook_url_v1',
  SUPER_ADMIN_EMAILS: 'kku_pojsarasin_super_admin_emails_v1',
  SYSTEM_RATINGS: 'kku_pojsarasin_system_ratings_v1',
};

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
  const url = getScriptUrl();
  if (!url) return;
  writeToSheets('__email', '', { email, subject, body });
}

export async function sendGoogleChatViaSheets(text: string): Promise<void> {
  const url = getScriptUrl();
  if (!url) return;
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.send(JSON.stringify({ key: '__gchat', value: text }));
  } catch (e) {
    console.warn('[Google Sheets] Failed to send Google Chat:', e);
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
      localStorage.setItem(STORAGE_KEYS.TICKETS, raw);
      return parsed as MaintenanceTicket[];
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
        const existingIds = new Set(parsed.map((t: any) => t.id));
        const missingInitials = INITIAL_TICKETS.filter((t) => !existingIds.has(t.id));

        let result = missingInitials.length > 0 ? [...parsed, ...missingInitials] : parsed;

        const hasAnyDirectives = result.some((t: any) => t.executiveDirectives && t.executiveDirectives.length > 0);
        if (!hasAnyDirectives) {
          result = result.map((t: MaintenanceTicket) => {
            const init = INITIAL_TICKETS.find(it => it.id === t.id);
            return init?.executiveDirectives ? { ...t, executiveDirectives: init.executiveDirectives } : t;
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
    const hasData = localStorage.getItem(STORAGE_KEYS.TICKETS) !== null;
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