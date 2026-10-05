import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function formatAmount(value) {
  return round2(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getItemName(item) {
  return item?.productName || item?.productCode || item?.item?.name || 'Item';
}

/** GST-inclusive selling price → taxable + tax split (Tally style). */
function getLineBreakdown(item) {
  const qty = Number(item.quantity) || 0;
  const gstRate = Number(item.gst) || 0;
  const lineTotalInc = round2(
    item.total !== undefined && item.total !== null
      ? Number(item.total)
      : qty * Number(item.price || 0)
  );
  const rateInclTax = round2(qty > 0 ? lineTotalInc / qty : Number(item.price || 0));
  const taxableAmount = round2(gstRate > 0 ? lineTotalInc / (1 + gstRate / 100) : lineTotalInc);
  const rateExTax = round2(qty > 0 ? taxableAmount / qty : taxableAmount);
  const taxAmount = round2(Math.max(0, lineTotalInc - taxableAmount));
  const cgstAmount = round2(taxAmount / 2);
  const sgstAmount = round2(taxAmount - cgstAmount);

  return {
    qty,
    gstRate,
    halfRate: round2(gstRate / 2),
    unit: item.unit || 'NOS',
    hsn: item.hsncode || item.hsn || '',
    rateInclTax,
    rateExTax,
    taxableAmount,
    taxAmount,
    cgstAmount,
    sgstAmount,
    lineTotalInc,
    discPercent: Number(item.disc) || 0,
  };
}

function numberToIndianWords(amount) {
  const n = Math.round((Number(amount) || 0) * 100) / 100;
  const whole = Math.floor(n);
  const paise = Math.round((n - whole) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (num) => {
    if (num < 20) return ones[num];
    return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`.trim();
  };

  const threeDigits = (num) => {
    const hundred = Math.floor(num / 100);
    const rest = num % 100;
    let out = '';
    if (hundred) out += `${ones[hundred]} Hundred`;
    if (rest) out += `${out ? ' ' : ''}${twoDigits(rest)}`;
    return out;
  };

  if (whole === 0 && paise === 0) return 'Indian Rupees Zero Only';

  let words = '';
  let num = whole;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) words += `${twoDigits(crore)} Crore `;
  if (lakh) words += `${twoDigits(lakh)} Lakh `;
  if (thousand) words += `${twoDigits(thousand)} Thousand `;
  if (num) words += `${threeDigits(num)} `;

  let result = `Indian Rupees ${words.trim()}`;
  if (paise > 0) result += ` and ${twoDigits(paise)} paise`;
  return `${result} Only`;
}

function resolveStoreDetails(invoice, storeArg) {
  const a = invoice?.store && typeof invoice.store === 'object' ? invoice.store : {};
  const b = storeArg && typeof storeArg === 'object' ? storeArg : {};
  return {
    name: a.name || b.name || '',
    address: a.address || b.address || '',
    gstNumber: a.gstNumber || b.gstNumber || '',
    storeEmail: a.storeEmail || b.storeEmail || a.email || b.email || '',
    state: a.state || b.state || '',
    code: a.code || b.code || '',
    storePanNumber: a.storePanNumber || b.storePanNumber || a.pan || b.pan || '',
    number: a.number ?? b.number ?? '',
  };
}

function buildInvoiceModel(invoice, storeArg) {
  const items = invoice.items || [];
  const rows = items.map((item) => ({ item, ...getLineBreakdown(item) }));

  const taxableTotal = round2(rows.reduce((s, r) => s + r.taxableAmount, 0));
  const gstTotal = round2(rows.reduce((s, r) => s + r.taxAmount, 0));
  const cgstTotal = round2(rows.reduce((s, r) => s + r.cgstAmount, 0));
  const sgstTotal = round2(rows.reduce((s, r) => s + r.sgstAmount, 0));
  const computedGross = round2(taxableTotal + cgstTotal + sgstTotal);
  const grandTotal = round2(invoice.total ?? rows.reduce((s, r) => s + r.lineTotalInc, 0));
  const roundOff = round2(grandTotal - computedGross);
  const qtyTotal = round2(rows.reduce((s, r) => s + r.qty, 0));

  const store = resolveStoreDetails(invoice, storeArg);
  const payment = invoice.paymentBreakdown || {};

  return {
    rows,
    taxableTotal,
    gstTotal,
    cgstTotal,
    sgstTotal,
    roundOff,
    grandTotal,
    qtyTotal,
    storeName: store.name,
    storeAddress: store.address,
    storeGst: store.gstNumber,
    storeEmail: store.storeEmail,
    storeState: store.state,
    storeCode: store.code,
    storePan: store.storePanNumber,
    storePhone: store.number,
    invoiceNumber: invoice.invoiceNumber || '—',
    invoiceDate: formatDate(invoice.approvedAt || invoice.createdAt),
    partyName: invoice.customerName || '—',
    partyPhone: invoice.customerPhone || '',
    amountWords: numberToIndianWords(grandTotal),
    cash: Number(payment.cash) || 0,
    upi: Number(payment.upi) || 0,
    debit: Number(payment.debit) || 0,
  };
}

/**
 * Modern A5 Tax Invoice — same data/content as before, updated visual design only.
 */
function buildInvoiceHtml(invoice, store, { pdf = false, orientation = 'landscape' } = {}) {
  const m = buildInvoiceModel(invoice, store);
  const isLandscape = orientation === 'landscape';

  const addressLine = String(m.storeAddress || '')
    .split(/,\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ');

  const itemRows = m.rows
    .map(
      (row, index) => `
      <tr>
        <td class="c">${index + 1}</td>
        <td class="l desc">${escapeHtml(getItemName(row.item))}</td>
        <td class="c">${escapeHtml(row.hsn || '')}</td>
        <td class="r">${escapeHtml(formatAmount(row.qty))} ${escapeHtml(row.unit)}</td>
        <td class="r">${escapeHtml(formatAmount(row.rateInclTax))}</td>
        <td class="r">${escapeHtml(formatAmount(row.rateExTax))}</td>
        <td class="c">${escapeHtml(row.unit)}</td>
        <td class="r">${escapeHtml(formatAmount(row.taxableAmount))}</td>
      </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sales_${escapeHtml(m.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: ${isLandscape ? '210mm' : '148mm'};
      min-height: ${isLandscape ? '148mm' : '210mm'};
      margin: 0 auto;
      padding: 7mm 8mm 6mm;
      background: #fff;
    }
    .accent {
      border: none;
      border-top: 1.5px solid #e67e22;
      margin: 5px 0 7px;
    }
    .jurisdiction {
      text-align: center;
      font-size: 9px;
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 5px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .brand-name {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: #111;
      line-height: 1.1;
    }
    .brand-sub {
      margin: 2px 0 0;
      font-size: 10px;
      color: #333;
      font-weight: 500;
    }
    .meta {
      text-align: right;
      font-size: 10px;
      line-height: 1.45;
      color: #222;
      padding-top: 2px;
    }
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 6px;
    }
    .parties h3 {
      margin: 0 0 3px;
      font-size: 10.5px;
      font-weight: 700;
      color: #111;
    }
    .parties p {
      margin: 0;
      font-size: 9.5px;
      line-height: 1.4;
      color: #222;
    }
    table.goods {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-top: 2px;
    }
    table.goods th {
      background: #1f1f1f;
      color: #fff;
      font-size: 8.5px;
      font-weight: 700;
      padding: 4px 4px;
      border: none;
    }
    table.goods th.r, table.goods td.r { text-align: right; }
    table.goods th.c, table.goods td.c { text-align: center; }
    table.goods th.l, table.goods td.l { text-align: left; }
    table.goods td.desc { font-weight: 600; }
    table.goods td {
      padding: 4px 4px;
      font-size: 9px;
      color: #222;
      border-bottom: 1px solid #eee;
      vertical-align: middle;
    }
    table.goods tbody tr:last-child td { border-bottom: none; }
    .tax-block {
      margin-top: 4px;
      width: 100%;
    }
    .tax-block .row {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      font-size: 9.5px;
      font-weight: 700;
      line-height: 1.45;
    }
    .tax-block .row .lbl { min-width: 110px; text-align: right; }
    .tax-block .row .val { min-width: 58px; text-align: right; }
    .tax-block .row.total {
      margin-top: 2px;
      font-size: 10.5px;
      padding-top: 3px;
      border-top: 1px solid #ddd;
    }
    .summary-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      margin-top: 6px;
    }
    .payment h3 {
      margin: 0 0 3px;
      font-size: 10.5px;
      font-weight: 700;
    }
    .payment p {
      margin: 0;
      font-size: 9.5px;
      color: #222;
      line-height: 1.45;
    }
    .totals {
      min-width: 52%;
    }
    .words-box {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 7px;
      font-size: 9.5px;
    }
    .words-box .amount {
      display: block;
      margin-top: 2px;
      font-weight: 700;
      font-size: 10px;
    }
    .words-box .eoe {
      white-space: nowrap;
      font-size: 9px;
    }
    .pan-line {
      margin-top: 5px;
      font-size: 9.5px;
    }
    .bottom {
      display: grid;
      grid-template-columns: 1.3fr 0.7fr;
      gap: 8px;
      margin-top: 6px;
      min-height: 52px;
    }
    .bottom .decl .h {
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
      margin-bottom: 3px;
      font-size: 10px;
    }
    .bottom .decl {
      font-size: 8.5px;
      line-height: 1.35;
      color: #222;
    }
    .bottom .sign {
      text-align: right;
      font-size: 9.5px;
    }
    .bottom .sign .for { font-weight: 700; }
    .bottom .sign .auth {
      margin-top: 28px;
      font-size: 9.5px;
    }
    .computer {
      text-align: center;
      font-size: 9px;
      text-decoration: underline;
      text-underline-offset: 2px;
      margin-top: 6px;
    }

    @media print {
      body { padding: 0; }
      .sheet { width: auto; min-height: auto; padding: 0; }
      @page { size: A5 ${orientation}; margin: 7mm; }
    }
    ${pdf ? `
    body { padding: 0 !important; }
    .sheet { width: ${isLandscape ? '196mm' : '134mm'} !important; margin: 0 !important; min-height: auto !important; padding: 0 !important; }
    ` : ''}
  </style>
</head>
<body>
  <div class="sheet">
    ${m.storeState ? `<div class="jurisdiction">Subject to Jamnagar Jurisdiction</div>` : ''}

    <div class="header">
      <div>
        <h1 class="brand-name">Happy Home</h1>
        <p class="brand-sub">Tax Invoice</p>
      </div>
      <div class="meta">
        <div>Invoice: ${escapeHtml(m.invoiceNumber)}</div>
        <div>Date: ${escapeHtml(m.invoiceDate)}</div>
      </div>
    </div>

    <hr class="accent" />

    <div class="parties">
      <div>
        <h3>Bill To</h3>
        <p>${escapeHtml(m.partyName)}</p>
        ${m.partyPhone ? `<p>Phone: ${escapeHtml(m.partyPhone)}</p>` : ''}
        ${m.storeState || m.storeCode ? `<p>State Name : ${escapeHtml(m.storeState)}${m.storeCode ? `, Code : ${escapeHtml(m.storeCode)}` : ''}</p>` : ''}
      </div>
      <div>
        <h3>Store Details</h3>
        ${m.storeName ? `<p>${escapeHtml(m.storeName)}</p>` : ''}
        ${addressLine ? `<p>${escapeHtml(addressLine)}</p>` : ''}
        ${m.storePhone !== '' && m.storePhone != null ? `<p>Mobile: ${escapeHtml(m.storePhone)}</p>` : ''}
        ${m.storeGst ? `<p>GSTIN/UIN: ${escapeHtml(m.storeGst)}</p>` : ''}
        ${m.storeState || m.storeCode ? `<p>State Name : ${escapeHtml(m.storeState)}${m.storeCode ? `, Code : ${escapeHtml(m.storeCode)}` : ''}</p>` : ''}
        ${m.storeEmail ? `<p>E-Mail : ${escapeHtml(m.storeEmail)}</p>` : ''}
      </div>
    </div>

    <table class="goods">
      <colgroup>
        <col style="width:6%" />
        <col style="width:28%" />
        <col style="width:11%" />
        <col style="width:13%" />
        <col style="width:13%" />
        <col style="width:11%" />
        <col style="width:6%" />
        <col style="width:12%" />
      </colgroup>
      <thead>
        <tr>
          <th class="c">Sl<br/>No.</th>
          <th class="l">Description of Goods</th>
          <th class="c">HSN/SAC</th>
          <th class="c">Quantity</th>
          <th class="c">Rate<br/>(Incl. of Tax)</th>
          <th class="c">Rate</th>
          <th class="c">per</th>
          <th class="c">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <hr class="accent" />

    <div class="summary-wrap">
      <div class="payment">
        <h3>Payment Mode</h3>
        <p>Cash: ${escapeHtml(formatAmount(m.cash))} &nbsp;&nbsp; GPay: ${escapeHtml(formatAmount(m.upi))} &nbsp;&nbsp; Debit: ${escapeHtml(formatAmount(m.debit))}</p>
      </div>
      <div class="totals">
        <div class="tax-block">
          <div class="row"><span class="lbl">Subtotal (Excl. GST) (Rs.)</span><span class="val">${escapeHtml(formatAmount(m.taxableTotal))}</span></div>
          <div class="row"><span class="lbl">CGST</span><span class="val">${escapeHtml(formatAmount(m.cgstTotal))}</span></div>
          <div class="row"><span class="lbl">SGST</span><span class="val">${escapeHtml(formatAmount(m.sgstTotal))}</span></div>
          <div class="row total"><span class="lbl">Final Total (Incl. GST) (Rs.)</span><span class="val">₹ ${escapeHtml(formatAmount(m.grandTotal))}</span></div>
        </div>
      </div>
    </div>

    <div class="words-box">
      <div>
        <div>Amount Chargeable (in words)</div>
        <strong class="amount">${escapeHtml(m.amountWords)}</strong>
      </div>
      <div class="eoe">E. &amp; O.E</div>
    </div>

    ${m.storePan ? `<div class="pan-line">Company's PAN : <strong>${escapeHtml(m.storePan)}</strong></div>` : ''}

    <div class="bottom">
      <div class="decl">
        <div class="h">Declaration</div>
        <div>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</div>
      </div>
      <div class="sign">
        <div class="for">for ${escapeHtml(m.storeName || '—')}</div>
        <div class="auth">Authorised Signatory</div>
      </div>
    </div>

    <div class="computer">This is a Computer Generated Invoice</div>
  </div>
</body>
</html>`;
}

function openInvoiceFrame(html, title, renderForPdf = false, orientation = 'landscape') {
  if (typeof document === 'undefined') return null;

  const existing = document.getElementById('invoice-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-print-frame';
  iframe.setAttribute('title', title || 'Invoice');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: renderForPdf ? '-10000px' : '0',
    top: renderForPdf ? '0' : 'auto',
    right: renderForPdf ? 'auto' : '0',
    bottom: renderForPdf ? 'auto' : '0',
    width: renderForPdf ? (orientation === 'landscape' ? '794px' : '559px') : '0',
    height: renderForPdf ? (orientation === 'landscape' ? '559px' : '794px') : '0',
    border: '0',
    opacity: renderForPdf ? '1' : '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!frameDoc) {
    iframe.remove();
    return null;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();
  return iframe;
}

function triggerFramePrint(iframe) {
  if (!iframe) return false;
  let printed = false;
  const run = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.remove();
      }, 1200);
    }
  };
  setTimeout(run, 100);
  return true;
}

export function printInvoice(invoice, store, orientation = 'landscape') {
  if (!invoice) return false;
  const html = buildInvoiceHtml(invoice, store, { orientation });
  const iframe = openInvoiceFrame(html, `Print ${invoice.invoiceNumber || 'invoice'}`, false, orientation);
  return triggerFramePrint(iframe);
}

export function downloadInvoicePdf(invoice, store) {
  if (!invoice) return false;
  const html = buildInvoiceHtml(invoice, store);
  const iframe = openInvoiceFrame(html, `PDF ${invoice.invoiceNumber || 'invoice'}`);
  return triggerFramePrint(iframe);
}

export function getInvoiceHtml(invoice, store) {
  return buildInvoiceHtml(invoice, store);
}

/** Download a PDF rendered in landscape A5 modern Tax Invoice layout (same content as print). */
export async function downloadInvoicePdfFile(invoice, store, orientation = 'landscape') {
  if (!invoice) return false;
  try {
    const m = buildInvoiceModel(invoice, store);
    const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a5', compress: true });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 7;
    const R = W - M;
    const cx = W / 2;
    let y = M;

    const font = (style = 'normal', size = 10) => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(size);
    };

    const drawAccent = (yy) => {
      pdf.setDrawColor(230, 126, 34);
      pdf.setLineWidth(0.45);
      pdf.line(M, yy, R, yy);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.2);
    };

    const ensure = (needed) => {
      if (y + needed > H - M) {
        pdf.addPage();
        y = M;
      }
    };

    // Jurisdiction
    if (m.storeState) {
      font('bold', 8);
      const note = 'SUBJECT TO JAMNAGAR JURISDICTION';
      pdf.text(note, cx, y + 3, { align: 'center' });
      const nw = pdf.getTextWidth(note);
      pdf.setLineWidth(0.2);
      pdf.line(cx - nw / 2, y + 3.7, cx + nw / 2, y + 3.7);
      y += 7;
    }

    // Header
    font('bold', 16);
    pdf.setTextColor(17, 17, 17);
    pdf.text('Happy Home', M, y + 4);
    font('normal', 9);
    pdf.text('Tax Invoice', M, y + 8.5);

    font('normal', 9);
    pdf.text(`Invoice: ${m.invoiceNumber}`, R, y + 3.5, { align: 'right' });
    pdf.text(`Date: ${m.invoiceDate}`, R, y + 8, { align: 'right' });

    y += 12;
    drawAccent(y);
    y += 5;

    // Bill To / Store Details
    const leftX = M;
    const rightX = M + (W - M * 2) / 2 + 1;
    const colW = (W - M * 2) / 2 - 3;

    font('bold', 9.5);
    pdf.text('Bill To', leftX, y);
    pdf.text('Store Details', rightX, y);
    y += 4;

    font('normal', 8.5);
    let leftY = y;
    let rightY = y;

    pdf.text(String(m.partyName || '—'), leftX, leftY);
    leftY += 3.6;
    if (m.partyPhone) {
      pdf.text(`Phone: ${m.partyPhone}`, leftX, leftY);
      leftY += 3.6;
    }
    if (m.storeState || m.storeCode) {
      const stateLine = `State Name : ${m.storeState}${m.storeCode ? `, Code : ${m.storeCode}` : ''}`;
      pdf.text(pdf.splitTextToSize(stateLine, colW), leftX, leftY);
      leftY += 3.6;
    }

    if (m.storeName) {
      pdf.text(pdf.splitTextToSize(String(m.storeName), colW), rightX, rightY);
      rightY += 3.6;
    }
    const addr = String(m.storeAddress || '').trim();
    if (addr) {
      const addrLines = pdf.splitTextToSize(addr, colW);
      pdf.text(addrLines, rightX, rightY);
      rightY += addrLines.length * 3.6;
    }
    if (m.storePhone !== '' && m.storePhone != null) {
      pdf.text(`Mobile: ${m.storePhone}`, rightX, rightY);
      rightY += 3.6;
    }
    if (m.storeGst) {
      pdf.text(`GSTIN/UIN: ${m.storeGst}`, rightX, rightY);
      rightY += 3.6;
    }
    if (m.storeState || m.storeCode) {
      const stateLine = `State Name : ${m.storeState}${m.storeCode ? `, Code : ${m.storeCode}` : ''}`;
      const lines = pdf.splitTextToSize(stateLine, colW);
      pdf.text(lines, rightX, rightY);
      rightY += lines.length * 3.6;
    }
    if (m.storeEmail) {
      pdf.text(`E-Mail : ${m.storeEmail}`, rightX, rightY);
      rightY += 3.6;
    }

    y = Math.max(leftY, rightY) + 2.5;

    const body = m.rows.map((row, i) => [
      { content: String(i + 1), styles: {halign: 'center' } },
      { content: getItemName(row.item), styles: {halign: 'left', fontStyle: 'bold' } },
      { content: row.hsn || '', styles: {halign: 'center' } },
      { content: `${formatAmount(row.qty)} ${row.unit}`, styles: {halign: 'right' } },
      { content: formatAmount(row.rateInclTax), styles: {halign: 'right' } },
      { content: formatAmount(row.rateExTax), styles: {halign: 'right' } },
      { content: row.unit, styles: {halign: 'center' } },
      { content: formatAmount(row.taxableAmount), styles: {halign: 'right' } },
    ]);

    autoTable(pdf, {
      startY: y,
      margin: { left: M, right: M, top: M, bottom: M },
      theme: 'plain',
      head: [['Sl\nNo.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate\n(Incl. of Tax)', 'Rate', 'per', 'Amount']],
      body,
      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: { top: 1.3, bottom: 1.3, left: 0.8, right: 0.8 },
        textColor: [34, 34, 34],
        lineColor: [238, 238, 238],
        lineWidth: { bottom: 0.15 },
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [31, 31, 31],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 6.5,
        cellPadding: { top: 1.6, bottom: 1.6, left: 0.8, right: 0.8 },
        lineWidth: 0,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 7 },
        1: { cellWidth: 36 },
        2: { cellWidth: 15 },
        3: { cellWidth: 16 },
        4: { cellWidth: 18 },
        5: { cellWidth: 15 },
        6: { cellWidth: 8 },
        7: { cellWidth: 19 },
      },
    });

    y = pdf.lastAutoTable.finalY + 3.5;
    drawAccent(y);
    y += 5;

    // Payment + tax totals
    font('bold', 9.5);
    pdf.text('Payment Mode', M, y);
    font('normal', 8.5);
    pdf.text(
      `Cash: ${formatAmount(m.cash)}   GPay: ${formatAmount(m.upi)}   Debit: ${formatAmount(m.debit)}`,
      M,
      y + 4
    );

    font('bold', 8.5);
    const totalRows = [
      ['Subtotal (Excl. GST) (Rs.)', formatAmount(m.taxableTotal)],
      ['CGST', formatAmount(m.cgstTotal)],
      ['SGST', formatAmount(m.sgstTotal)],
      ['Final Total (Incl. GST) (Rs.)', `Rs. ${formatAmount(m.grandTotal)}`],
    ];
    let ty = y;
    totalRows.forEach(([lbl, val], idx) => {
      if (idx === totalRows.length - 1) font('bold', 9);
      else font('bold', 8);
      pdf.text(lbl, R - 30, ty, { align: 'right' });
      pdf.text(val, R, ty, { align: 'right' });
      ty += 3.8;
    });
    y = Math.max(y + 10, ty) + 3;

    ensure(40);

    // Amount in words + E&OE
    font('normal', 8.5);
    pdf.text('Amount Chargeable (in words)', M, y);
    font('normal', 8);
    pdf.text('E. & O.E', R, y, { align: 'right' });
    y += 4;
    font('bold', 9);
    const words = pdf.splitTextToSize(m.amountWords, W - M * 2 - 18);
    pdf.text(words, M, y);
    y += words.length * 3.6 + 2;

    if (m.storePan) {
      font('normal', 8.5);
      const lbl = "Company's PAN : ";
      pdf.text(lbl, M, y);
      font('bold', 8.5);
      pdf.text(m.storePan, M + pdf.getTextWidth(lbl), y);
      y += 5;
    }

    // Declaration + signatory
    font('bold', 9);
    pdf.text('Declaration', M, y);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + 0.7, M + pdf.getTextWidth('Declaration'), y + 0.7);
    font('bold', 9);
    pdf.text(`for ${m.storeName || '—'}`, R, y, { align: 'right' });

    font('normal', 7.5);
    const decl = pdf.splitTextToSize(
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      (W - M * 2) * 0.62
    );
    pdf.text(decl, M, y + 4);

    font('normal', 8.5);
    pdf.text('Authorised Signatory', R, y + 16, { align: 'right' });

    y += 22;
    ensure(6);
    font('normal', 8);
    const footer = 'This is a Computer Generated Invoice';
    pdf.text(footer, cx, y, { align: 'center' });
    const fw = pdf.getTextWidth(footer);
    pdf.line(cx - fw / 2, y + 0.7, cx + fw / 2, y + 0.7);

    const filename = String(invoice.invoiceNumber || 'invoice').replace(/[\\/:*?"<>|]/g, '_');
    pdf.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Unable to generate invoice PDF file', err);
    return false;
  }
}
