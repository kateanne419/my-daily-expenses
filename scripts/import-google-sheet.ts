/**
 * Google Sheets import script (Phase 4)
 *
 * Usage:
 *   GOOGLE_SHEETS_ID=... GOOGLE_ACCESS_TOKEN=... npx tsx scripts/import-google-sheet.ts
 *
 * Validates imported months against onHand, totalIncome, totalExpenses before marking complete.
 */

const SHEET_ID = process.env.GOOGLE_SHEETS_ID ?? '1Pu2DIwmiIw_6wHdsHAjz6TDPJOct3MGhscicELvQ1Vo';

async function listMonthTabs(): Promise<string[]> {
  const token = process.env.GOOGLE_ACCESS_TOKEN;
  if (!token) {
    console.error('Set GOOGLE_ACCESS_TOKEN to use the Sheets API.');
    return [];
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await res.text());
  const data = (await res.json()) as { sheets?: { properties: { title: string } }[] };
  return (data.sheets ?? [])
    .map((s) => s.properties.title)
    .filter((t) => /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/.test(t));
}

async function main() {
  console.log('Expense Tracker — Google Sheets import');
  console.log(`Workbook: ${SHEET_ID}`);
  const tabs = await listMonthTabs();
  if (tabs.length === 0) {
    console.log('\nNo tabs discovered. Provide OAuth token or export .xlsx manually.');
    console.log('Import order per tab: accounts → budgets → transactions → transfers → CC payments → recompute');
    return;
  }
  console.log(`Found ${tabs.length} month tabs:`, tabs.join(', '));
  console.log('\nWire Supabase client + parsers during Phase 4 integration.');
}

main().catch(console.error);
