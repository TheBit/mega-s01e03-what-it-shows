// What #4471 really holds: one row per problem, built from the reports on every render.
// causes.ts says which cause a tenant's report belongs to. It files every report by tenant and
// channel, so a report that describes a different symptom still lands under `parser`. The desk
// read those reports (desk-notes.json, `oneDayMove`): the date moved by one day, it did not flip.
// That is a third problem, and it gets its own ticket.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day', 'unplaced'];

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemRow = {
  problem: Problem;
  ids: string[];
  tenants: number;
  channels: Record<string, number>;
  // What intake tagged these reports as: tag → count. Intake guesses from the browser.
  taggedAs: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export type Split = { exported: number; unique: number; rows: ProblemRow[] };

const tally = (xs: string[]) => xs.reduce<Record<string, number>>((n, x) => ({ ...n, [x]: (n[x] ?? 0) + 1 }), {});

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const inTicket = all.filter((r) => r.mergedInto === ticket);
  const reports = uniqueById(inTicket);
  const by = new Map<Problem, Report[]>();
  for (const r of reports) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    by.set(p, [...(by.get(p) ?? []), r]);
  }
  const rows = PROBLEMS.filter((p) => by.has(p)).map((problem) => {
    const rs = by.get(problem)!;
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      problem,
      ids: rs.map((r) => r.id).sort(),
      tenants: new Set(rs.map((r) => r.tenant)).size,
      channels: tally(rs.map((r) => r.channel)),
      taggedAs: tally(rs.map((r) => r.meta.intakeTag)),
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    };
  });
  return { exported: inTicket.length, unique: reports.length, rows };
}
