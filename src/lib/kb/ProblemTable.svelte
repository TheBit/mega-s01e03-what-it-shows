<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, type Problem } from '#lib/kb/problems';

  // `tickets`: where each problem is tracked now, problem → link.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Partial<Record<Problem, string>> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const WHAT: Record<Problem, string> = {
    parser: 'day and month swapped: the shared parser reads a day-first date month first',
    hint: 'day and month swapped: booking-v3 prints MM/DD/YYYY under the date field, people type month first, the form reads it day first',
    'one-day': 'the date moves by one day; day and month are not swapped',
    unplaced: 'no day-first tenant on file; cause not known',
  };
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{split.exported}</strong> rows exported for #{ticket} ·
  <strong>{split.unique}</strong> reports once each id is counted once ·
  <strong>{split.rows.length}</strong>
  {split.rows.length === 1 ? 'problem' : 'problems'}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>what the reports show</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.rows as row (row.problem)}
      <tr>
        <td><code>{row.problem}</code></td>
        <td><strong>{row.ids.length}</strong></td>
        <td>{WHAT[row.problem]}</td>
        <td>{row.tenants}</td>
        <td class="small">{list(row.channels)}</td>
        <td class="small">{list(row.taggedAs)}</td>
        <td class="small">{row.firstSeen} → {row.lastSeen}</td>
        <td>{#if tickets[row.problem]}<a href={tickets[row.problem]}>{tickets[row.problem]?.replace(/^.*\/issues\//, '#')}</a>{:else}<span class="none">none yet</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.rows.filter((r) => r.ids.length <= 10) as row (row.problem)}
  <p class="small"><code>{row.problem}</code> reports: {row.ids.join(', ')}</p>
{/each}

<style>
  .sum { font-size: 1.05rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
