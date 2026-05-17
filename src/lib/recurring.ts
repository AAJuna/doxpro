import type { DocumentRecord, RecurringSchedule } from "@/types";
import {
  listDocuments,
  saveDocument,
  nextDocumentSequence,
  getSetting,
  setSetting,
} from "@/lib/db/queries";
import { generateDocumentNumber } from "@/lib/calc";
import { uuid, nowIso } from "@/lib/utils";

/**
 * Advance ISO date YYYY-MM-DD by schedule unit.
 * Pure function — tidak modify input.
 */
export function advanceDate(iso: string, schedule: RecurringSchedule): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (schedule === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (schedule === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else if (schedule === "yearly") {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface RecurringRunResult {
  generated: number;
  generatedIds: string[];
  skipped: number;
  errors: string[];
}

/**
 * Scan dokumen recurring yang aktif + next_date sudah lewat hari ini.
 * Untuk tiap match: generate copy baru (status draft, tanggal hari ini,
 * nomor baru sesuai numbering scheme), advance next_date di source doc.
 *
 * Idempotent-ish: setiap call hanya generate satu copy per source per hari
 * (karena advance_date langsung pindah ke periode berikut).
 */
export async function runRecurringCheck(numberingScheme: string): Promise<RecurringRunResult> {
  const result: RecurringRunResult = { generated: 0, generatedIds: [], skipped: 0, errors: [] };
  const today = todayIso();

  const allDocs = await listDocuments();
  const sources = allDocs.filter(
    (d) =>
      d.recurringActive &&
      d.recurringSchedule &&
      d.recurringNextDate &&
      d.recurringNextDate <= today,
  );

  for (const src of sources) {
    try {
      const schedule = src.recurringSchedule as RecurringSchedule;
      const targetDate = src.recurringNextDate!;
      const t = new Date(targetDate);
      const seq = await nextDocumentSequence(src.type, t.getFullYear(), t.getMonth() + 1);
      const newNumber = generateDocumentNumber(numberingScheme, src.type, seq, t);
      const newId = uuid();
      const copy: DocumentRecord = {
        ...src,
        id: newId,
        number: newNumber,
        date: targetDate,
        // Set jatuh tempo / valid based on type
        dueDate:
          src.type === "invoice"
            ? new Date(t.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : undefined,
        validUntil:
          src.type === "penawaran" || src.type === "proposal"
            ? new Date(t.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
            : undefined,
        status: "draft",
        recurringSchedule: null,
        recurringNextDate: undefined,
        recurringActive: false,
        items: src.items.map((it) => ({ ...it, id: uuid(), documentId: newId })),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await saveDocument(copy);

      // Advance source next_date. Catch up kalau next_date masih <= today
      // (user gak buka app beberapa periode). Safety bound:
      //  - max 1000 iterasi
      //  - break kalau advanceDate gak progress (invalid input → return same)
      let nextDate = advanceDate(targetDate, schedule);
      let iterGuard = 0;
      while (nextDate <= today && iterGuard < 1000) {
        const advanced = advanceDate(nextDate, schedule);
        if (advanced === nextDate) {
          // No progress (invalid date) — keluar daripada infinite loop
          result.errors.push(
            `${src.number}: advanceDate stuck (invalid date "${nextDate}"), skipping catch-up`,
          );
          break;
        }
        nextDate = advanced;
        iterGuard += 1;
      }
      if (iterGuard >= 1000) {
        result.errors.push(`${src.number}: catch-up loop hit max iterations`);
      }
      await saveDocument({ ...src, id: src.id, recurringNextDate: nextDate });

      result.generated += 1;
      result.generatedIds.push(newId);
    } catch (e) {
      result.errors.push(`${src.number}: ${e instanceof Error ? e.message : String(e)}`);
      result.skipped += 1;
    }
  }

  // Catat timestamp run terakhir di settings table
  await setSetting("recurring_last_run", new Date().toISOString());
  return result;
}

export async function getLastRecurringRun(): Promise<string | null> {
  return getSetting("recurring_last_run");
}
