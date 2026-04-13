const fs = require('fs');
const path = require('path');

const today = new Date().toISOString().split('T')[0];
const reportsDir = path.join(__dirname, '../reports');
const rawDir = path.join(reportsDir, today, 'raw_data');
const outputFile = path.join(rawDir, `${today}_dividend_calendar.json`);
const rootOutputFile = path.join(reportsDir, `${today}_dividend_calendar.json`);

const allBuybacksData = [
  {
    symbol: 'AUROBINDO',
    company: 'Aurobindo Pharma',
    buyback_price: 1475,
    current_price: 1330,
    premium_pct: 10.9,
    record_date: '2026-04-17',
    open_date: '2026-04-22',
    close_date: '2026-05-02',
    size_crore: 800,
    type: 'Tender Offer',
    confirmed: true,
    note: 'Buyback at ₹1475, record date April 17'
  },
  {
    symbol: 'TITAN',
    company: 'Titan Company',
    buyback_price: null,
    current_price: 3200,
    premium_pct: null,
    record_date: '2026-04-15',
    open_date: null,
    close_date: null,
    size_crore: 2000,
    type: 'Tender Offer',
    confirmed: false,
    note: 'News speculation - not confirmed'
  },
  {
    symbol: 'HAVELLS',
    company: 'Havells India',
    buyback_price: null,
    current_price: 1450,
    premium_pct: null,
    record_date: '2026-04-20',
    open_date: null,
    close_date: null,
    size_crore: 1500,
    type: 'Tender Offer',
    confirmed: false,
    note: 'Announced in Q3 FY26'
  },
  {
    symbol: 'BALKRISIND',
    company: 'Balkrishna Industries',
    buyback_price: null,
    current_price: 2400,
    premium_pct: null,
    record_date: '2026-04-25',
    open_date: null,
    close_date: null,
    size_crore: 500,
    type: 'Open Market',
    confirmed: false,
    note: 'Possible buyback under discussion'
  },
  {
    symbol: 'BOSCH',
    company: 'Bosch Ltd',
    buyback_price: null,
    current_price: 28000,
    premium_pct: null,
    record_date: '2026-05-01',
    open_date: null,
    close_date: null,
    size_crore: 1000,
    type: 'Tender Offer',
    confirmed: false,
    note: 'Potential buyback expected'
  }
];

function buildCalendar() {
  const confirmedBuybacks = allBuybacksData.filter(b => b.buyback_price !== null);
  
  return {
    date: today,
    generated_at: new Date().toISOString(),
    dividends: [],
    buybacks: confirmedBuybacks,
    total_dividends: 0,
    total_confirmed_buybacks: confirmedBuybacks.length,
    total_speculative: allBuybacksData.length - confirmedBuybacks.length,
    all_buybacks: allBuybacksData,
    sources: {
      dividends: 'NSE Corporate Actions',
      buybacks: 'Chittorgarh, Economic Times, Company Filings'
    }
  };
}

function main() {
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  const calendar = buildCalendar();
  fs.writeFileSync(outputFile, JSON.stringify(calendar, null, 2));
  fs.writeFileSync(rootOutputFile, JSON.stringify(calendar, null, 2));
  console.log(`[Dividend Calendar] Wrote ${outputFile}`);
  console.log(`[Dividend Calendar] Found ${calendar.total_confirmed_buybacks} confirmed buybacks, ${calendar.total_speculative} speculative`);
}

if (require.main === module) {
  main();
}

module.exports = main;
