import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
    .replace(/ /g, '-');
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
  const cgstTotal = round2(rows.reduce((s, r) => s + r.cgstAmount, 0));
  const sgstTotal = round2(rows.reduce((s, r) => s + r.sgstAmount, 0));
  const computedGross = round2(taxableTotal + cgstTotal + sgstTotal);
  const grandTotal = round2(invoice.total ?? rows.reduce((s, r) => s + r.lineTotalInc, 0));
  const roundOff = round2(grandTotal - computedGross);
  const qtyTotal = round2(rows.reduce((s, r) => s + r.qty, 0));

  const store = resolveStoreDetails(invoice, storeArg);

  return {
    rows,
    taxableTotal,
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
    invoiceNumber: invoice.invoiceNumber || '—',
    invoiceDate: formatDate(invoice.approvedAt || invoice.createdAt),
    partyName: invoice.customerName || '—',
    partyPhone: invoice.customerPhone || '',
    amountWords: numberToIndianWords(grandTotal),
  };
}

/**
 * Exact Tally tax-invoice HTML layout matching Happy Home sales invoice.
 */
function buildInvoiceHtml(invoice, store, { pdf = false } = {}) {
  const m = buildInvoiceModel(invoice, store);

  // Centered multi-line address like Tally invoice (not one long run-on line)
  const addressLines = String(m.storeAddress || '')
    .split(/,\s*/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Keep ~2–3 visual lines
  let addressHtml = '';
  if (addressLines.length) {
    if (addressLines.length <= 3) {
      addressHtml = addressLines.map((l) => escapeHtml(l)).join('<br/>');
    } else {
      const mid = Math.ceil(addressLines.length / 2);
      addressHtml = [
        escapeHtml(addressLines.slice(0, mid).join(', ')),
        escapeHtml(addressLines.slice(mid).join(', ')),
      ].join('<br/>');
    }
  }

  const itemRows = m.rows
    .map(
      (row, index) => `
      <tr class="item-row">
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

  // Spacer rows so the items table fills like Tally (tax lines sit near bottom)
  const spacerCount = Math.max(0, 8 - m.rows.length);
  const spacerRows = Array.from({ length: spacerCount })
    .map(
      () => `
      <tr class="spacer-row">
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
        <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
      </tr>`
    )
    .join('');

  const roundOffLabel =
    m.roundOff < 0
      ? `(-)${formatAmount(Math.abs(m.roundOff))}`
      : formatAmount(m.roundOff);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sales_${escapeHtml(m.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 8px;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 190mm;
      margin: 0 auto;
      border: none;
    }
    .top-note {
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
      padding: 4px 6px 5px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    /* Invoice No / Dated on one open row — no vertical box split */
    .inv-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 6px 10px 4px;
      gap: 16px;
    }
    .inv-meta .left { text-align: left; }
    .inv-meta .right { text-align: right; }
    .inv-meta .label { font-size: 11px; }
    .inv-meta .value { font-weight: 700; font-size: 12px; }
    .inv-meta .ref { margin-top: 8px; font-size: 11px; min-height: 14px; }

    /* Company block: fully centered, no side boxes */
    .company {
      text-align: center;
      padding: 4px 16px 8px;
    }
    .company h1 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
    }
    .company p {
      margin: 2px 0;
      line-height: 1.4;
      font-size: 11px;
    }

    .doc-title {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 1.5px;
      padding: 4px 0 6px;
    }

    .party {
      text-align: center;
      padding: 2px 10px 8px;
      line-height: 1.5;
      font-size: 11px;
    }
    .party .name { font-weight: 700; }

    /* Single line under header before goods table */
    .header-rule {
      border: none;
      border-top: 1px solid #000;
      margin: 0;
    }

    table.goods {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.goods th, table.goods td {
      border: 1px solid #000;
      padding: 4px 4px;
      vertical-align: middle;
      font-size: 11px;
      line-height: 1.25;
    }
    table.goods th {
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      background: #fff;
      line-height: 1.2;
    }
    table.goods .c { text-align: center; }
    table.goods .r { text-align: right; }
    table.goods .l { text-align: left; }
    table.goods .desc { font-weight: 600; }
    table.goods .spacer-row td {
      border-top: none;
      border-bottom: none;
      height: 14px;
      padding: 0;
    }
    table.goods .spacer-row td:first-child { border-left: 1px solid #000; }
    table.goods .spacer-row td:last-child { border-right: 1px solid #000; }
    table.goods tr.tax-line td {
      border-top: none;
      border-bottom: none;
      font-size: 11px;
      padding-top: 1px;
      padding-bottom: 1px;
    }
    table.goods tr.tax-line td.lbl { text-align: right; font-weight: 600; padding-right: 8px; }
    table.goods tr.total-row td {
      border-top: 1px solid #000;
      font-weight: 700;
      vertical-align: middle;
    }
    table.goods tr.total-row td.grand {
      font-size: 13px;
      white-space: nowrap;
    }

    .words-box {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 5px 8px;
      border-bottom: none;
      font-size: 11px;
    }
    .words-box .left strong.amount { display: block; margin-top: 2px; font-size: 12px; }
    .words-box .eoe { white-space: nowrap; font-size: 10px; }

    .pan-line {
      padding: 5px 8px 2px;
      font-size: 11px;
      border-top: none;
    }

    .bottom {
      display: grid;
      grid-template-columns: 1.25fr 0.75fr;
      border-top: none;
      min-height: 95px;
    }
    .bottom .decl {
      padding: 6px 8px;
      border-right: none;
      font-size: 10px;
      line-height: 1.4;
    }
    .bottom .decl .h {
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .bottom .sign {
      padding: 6px 8px;
      text-align: right;
      font-size: 11px;
    }
    .bottom .sign .for { font-weight: 700; }
    .bottom .sign .auth {
      margin-top: 52px;
      font-size: 11px;
    }

    .computer {
      text-align: center;
      font-size: 10px;
      text-decoration: underline;
      text-underline-offset: 3px;
      padding: 4px;
      margin-bottom: 3px;
      border-top: none;
    }

    @media print {
      body { padding: 0; }
      .sheet { width: auto; border: none; }
      @page { size: A4; margin: 8mm; }
    }
    ${pdf ? `
    /* Match print layout: A4 (210mm) minus 8mm margins = 194mm */
    body { padding: 0 !important; }
    .sheet { width: 194mm !important; margin: 0 !important; }
    ` : ''}
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-note">${m.storeState ? `Subject to Jamnagar Jurisdiction` : ''}</div>

    <div class="inv-meta">
      <div class="left">
        <div class="label">Invoice No. <span class="value">${escapeHtml(m.invoiceNumber)}</span></div>
      </div>
      <div class="right">
        <div class="label">Dated <span class="value">${escapeHtml(m.invoiceDate)}</span></div>
      </div>
    </div>

    <div class="company">
      ${m.storeName ? `<h1>${escapeHtml(m.storeName)}</h1>` : ''}
      ${addressHtml ? `<p>${addressHtml}</p>` : ''}
      ${m.storeGst ? `<p>GSTIN/UIN: ${escapeHtml(m.storeGst)}</p>` : ''}
      ${m.storeState || m.storeCode ? `<p>State Name : ${escapeHtml(m.storeState)}${m.storeCode ? `, Code : ${escapeHtml(m.storeCode)}` : ''}</p>` : ''}
      ${m.storeEmail ? `<p>E-Mail : ${escapeHtml(m.storeEmail)}</p>` : ''}
    </div>

    <div class="doc-title">INVOICE</div>

    <div class="party">
      <div>Party : <span class="name">${escapeHtml(m.partyName)}</span></div>
      ${m.storeState || m.storeCode ? `<div>State Name : ${escapeHtml(m.storeState)}${m.storeCode ? `, Code : ${escapeHtml(m.storeCode)}` : ''}</div>` : ''}
    </div>

    <hr class="header-rule" />

    <table class="goods">
      <colgroup>
        <col style="width:5%" />
        <col style="width:30%" />
        <col style="width:11%" />
        <col style="width:12%" />
        <col style="width:13%" />
        <col style="width:11%" />
        <col style="width:6%" />
        <col style="width:12%" />
      </colgroup>
      <thead>
        <tr>
          <th>Sl<br/>No.</th>
          <th>Description of Goods</th>
          <th>HSN/SAC</th>
          <th>Quantity</th>
          <th>Rate<br/>(Incl. of Tax)</th>
          <th>Rate</th>
          <th>per</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        ${spacerRows}
        <tr class="tax-line">
          <td></td>
          <td></td><td></td><td></td><td></td><td></td><td></td>
          <td class="r">${escapeHtml(formatAmount(m.taxableTotal))}</td>
        </tr>
        <tr class="tax-line">
          <td></td>
          <td class="lbl">CGST</td>
          <td></td><td></td><td></td><td></td><td></td>
          <td class="r">${escapeHtml(formatAmount(m.cgstTotal))}</td>
        </tr>
        <tr class="tax-line">
          <td></td>
          <td class="lbl">SGST</td>
          <td></td><td></td><td></td><td></td><td></td>
          <td class="r">${escapeHtml(formatAmount(m.sgstTotal))}</td>
        </tr>
        <tr class="tax-line">
          <td></td>
          <td class="lbl">Less : ROUND OFF</td>
          <td></td><td></td><td></td><td></td><td></td>
          <td class="r">${escapeHtml(roundOffLabel)}</td>
        </tr>
        <tr class="total-row">
          <td></td>
          <td class="l">Total</td>
          <td></td>
          <td class="r">${escapeHtml(formatAmount(m.qtyTotal))} NOS</td>
          <td></td><td></td><td></td>
          <td class="r grand">₹ ${escapeHtml(formatAmount(m.grandTotal))}</td>
        </tr>
      </tbody>
    </table>

    <div class="words-box">
      <div class="left">
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

function openInvoiceFrame(html, title, renderForPdf = false) {
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
    width: renderForPdf ? '794px' : '0',
    height: renderForPdf ? '1123px' : '0',
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

/**
 * Print invoice in Tally tax-invoice format (same layout as Happy Home sales PDF).
 */
export function printInvoice(invoice, store) {
  if (!invoice) return false;
  const html = buildInvoiceHtml(invoice, store);
  const iframe = openInvoiceFrame(html, `Print ${invoice.invoiceNumber || 'invoice'}`);
  return triggerFramePrint(iframe);
}

/**
 * Download / Save-as-PDF using the exact same HTML layout as print.
 * Opens the browser print dialog so the saved PDF matches the on-screen invoice.
 */
export function downloadInvoicePdf(invoice, store) {
  if (!invoice) return false;
  const html = buildInvoiceHtml(invoice, store);
  const iframe = openInvoiceFrame(html, `PDF ${invoice.invoiceNumber || 'invoice'}`);
  return triggerFramePrint(iframe);
}

/** Exported for tests / preview if needed */
export function getInvoiceHtml(invoice, store) {
  return buildInvoiceHtml(invoice, store);
}

/** Download a PDF rendered from the same invoice HTML used by printInvoice. */
export async function downloadInvoicePdfFile(invoice, store) {
  if (!invoice) return false;
  try {
    const m = buildInvoiceModel(invoice, store);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const M = 8;
    const R = W - M;
    const cx = W / 2;
    let y = M + 4;

    const font = (style = 'normal', size = 10) => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(size);
    };
    const center = (text, yy, style, size, underline = false) => {
      font(style, size);
      pdf.text(text, cx, yy, { align: 'center' });
      if (underline) {
        const w = pdf.getTextWidth(text);
        pdf.setLineWidth(0.2);
        pdf.line(cx - w / 2, yy + 0.8, cx + w / 2, yy + 0.8);
      }
    };
    const ensure = (needed) => {
      if (y + needed > H - M) {
        pdf.addPage();
        y = M + 4;
      }
    };

    // Top note
    if (m.storeState) {
      center(`SUBJECT TO JAMNAGAR JURISDICTION`, y, 'bold', 9, true);
    }
    y += 8;

    // Invoice no / date
    font('normal', 10);
    pdf.text('Invoice No. ', M + 2, y);
    const w1 = pdf.getTextWidth('Invoice No. ');
    font('bold', 11);
    pdf.text(String(m.invoiceNumber), M + 2 + w1, y);

    font('bold', 11);
    const dateW = pdf.getTextWidth(String(m.invoiceDate));
    pdf.text(String(m.invoiceDate), R - 2, y, { align: 'right' });
    font('normal', 10);
    pdf.text('Dated ', R - 2 - dateW, y, { align: 'right' });

    y += 5;
    font('normal', 10);
    pdf.text('Ref. No.', M + 2, y);
    y += 8;

    // Company block
    if (m.storeName) {
      center(m.storeName.toUpperCase(), y, 'bold', 16);
      y += 7;
    }
    const addrParts = String(m.storeAddress || '').split(/,\s*/).map((p) => p.trim()).filter(Boolean);
    let addrLines = addrParts;
    if (addrParts.length > 3) {
      const mid = Math.ceil(addrParts.length / 2);
      addrLines = [addrParts.slice(0, mid).join(', '), addrParts.slice(mid).join(', ')];
    }
    addrLines.forEach((l) => { center(l, y, 'normal', 10); y += 4.6; });
    if (m.storeGst) { center(`GSTIN/UIN: ${m.storeGst}`, y, 'normal', 10); y += 4.6; }
    if (m.storeState || m.storeCode) {
      center(`State Name : ${m.storeState}${m.storeCode ? `, Code : ${m.storeCode}` : ''}`, y, 'normal', 10);
      y += 4.6;
    }
    if (m.storeEmail) { center(`E-Mail : ${m.storeEmail}`, y, 'normal', 10); y += 4.6; }

    y += 3;
    center('INVOICE', y, 'bold', 14);
    y += 7;

    // Party
    font('normal', 10);
    const partyLabel = 'Party : ';
    const partyW = pdf.getTextWidth(partyLabel);
    font('bold', 10);
    const nameW = pdf.getTextWidth(m.partyName);
    const startX = cx - (partyW + nameW) / 2;
    font('normal', 10);
    pdf.text(partyLabel, startX, y);
    font('bold', 10);
    pdf.text(m.partyName, startX + partyW, y);
    y += 4.6;
    if (m.storeState || m.storeCode) {
      center(`State Name : ${m.storeState}${m.storeCode ? `, Code : ${m.storeCode}` : ''}`, y, 'normal', 10);
      y += 4.6;
    }
    y += 2;

    // Goods table
    const noSide = { top: 0, bottom: 0, left: 0.2, right: 0.2 };
    const body = m.rows.map((row, i) => [
      { content: String(i + 1), styles: { halign: 'center' } },
      { content: getItemName(row.item), styles: { halign: 'left', fontStyle: 'bold' } },
      { content: row.hsn || '', styles: { halign: 'center' } },
      { content: `${formatAmount(row.qty)} ${row.unit}`, styles: { halign: 'right' } },
      { content: formatAmount(row.rateInclTax), styles: { halign: 'right' } },
      { content: formatAmount(row.rateExTax), styles: { halign: 'right' } },
      { content: row.unit, styles: { halign: 'center' } },
      { content: formatAmount(row.taxableAmount), styles: { halign: 'right' } },
    ]);

    const spacerHeight = Math.max(0, (8 - m.rows.length) * 5);
    const taxRow = (label, value) => [
      { content: '', styles: { lineWidth: noSide } },
      { content: label, styles: { halign: 'right', fontStyle: 'bold', lineWidth: noSide } },
      { content: '', styles: { lineWidth: noSide } },
      { content: '', styles: { lineWidth: noSide } },
      { content: '', styles: { lineWidth: noSide } },
      { content: '', styles: { lineWidth: noSide } },
      { content: '', styles: { lineWidth: noSide } },
      { content: value, styles: { halign: 'right', lineWidth: noSide } },
    ];
    const roundOffLabel = m.roundOff < 0 ? `(-)${formatAmount(Math.abs(m.roundOff))}` : formatAmount(m.roundOff);

    const spacerSide = { top: 0.2, bottom: 0, left: 0.2, right: 0.2 };
    body.push([
      ...Array(8).fill(null).map(() => ({
        content: '',
        styles: { lineWidth: spacerSide, minCellHeight: spacerHeight, cellPadding: 0 },
      })),
    ]);
    body.push(taxRow('', formatAmount(m.taxableTotal)));
    body.push(taxRow('CGST', formatAmount(m.cgstTotal)));
    body.push(taxRow('SGST', formatAmount(m.sgstTotal)));
    body.push(taxRow('Less : ROUND OFF', roundOffLabel));
    body.push([
      { content: '' },
      { content: 'Total', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: '' },
      { content: `${formatAmount(m.qtyTotal)} NOS`, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '' },
      { content: '' },
      { content: '' },
      { content: `Rs. ${formatAmount(m.grandTotal)}`, styles: { halign: 'right', fontStyle: 'bold', fontSize: 10.5 } },
    ]);

    autoTable(pdf, {
      startY: y,
      margin: { left: M, right: M, top: M, bottom: M },
      theme: 'grid',
      head: [['Sl\nNo.', 'Description of Goods', 'HSN/SAC', 'Quantity', 'Rate\n(Incl. of Tax)', 'Rate', 'per', 'Amount']],
      body,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: { top: 2, bottom: 2, left: 1.5, right: 1.5 },
        lineColor: [0, 0, 0],
        lineWidth: 0.2,
        textColor: [0, 0, 0],
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 9.7 },
        1: { cellWidth: 58.2 },
        2: { cellWidth: 21.3 },
        3: { cellWidth: 23.3 },
        4: { cellWidth: 25.2 },
        5: { cellWidth: 21.3 },
        6: { cellWidth: 11.6 },
        7: { cellWidth: 23.3 },
      },
    });

    y = pdf.lastAutoTable.finalY + 6;

    // Amount in words
    ensure(50);
    font('normal', 10);
    pdf.text('Amount Chargeable (in words)', M + 2, y);
    font('normal', 9);
    pdf.text('E. & O.E', R - 2, y, { align: 'right' });
    y += 5;
    font('bold', 10.5);
    pdf.text(m.amountWords, M + 2, y);
    y += 8;

    if (m.storePan) {
      font('normal', 10);
      const lbl = "Company's PAN : ";
      pdf.text(lbl, M + 2, y);
      font('bold', 10);
      pdf.text(m.storePan, M + 2 + pdf.getTextWidth(lbl) - 0.2, y);
      y += 7;
    }

    // Declaration + signatory
    font('bold', 10);
    pdf.text('Declaration', M + 2, y);
    pdf.setLineWidth(0.2);
    pdf.line(M + 2, y + 0.8, M + 2 + pdf.getTextWidth('Declaration'), y + 0.8);
    font('bold', 10);
    pdf.text(`for ${m.storeName || '—'}`, R - 2, y, { align: 'right' });

    font('normal', 9);
    const decl = pdf.splitTextToSize(
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      110
    );
    pdf.text(decl, M + 2, y + 5);

    y += 24;
    font('normal', 10);
    pdf.text('Authorised Signatory', R - 2, y, { align: 'right' });

    y += 12;
    ensure(8);
    center('This is a Computer Generated Invoice', y, 'normal', 9, true);

    const filename = String(invoice.invoiceNumber || 'invoice').replace(/[\\/:*?"<>|]/g, '_');
    pdf.save(`${filename}.pdf`);
    return true;
  } catch (err) {
    console.error('Unable to generate invoice PDF file', err);
    return false;
  }
}
