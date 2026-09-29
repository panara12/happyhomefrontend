import { jsPDF } from 'jspdf';

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
function buildInvoiceHtml(invoice, store) {
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
      padding: 4px 6px 3px;
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
      padding: 3px 4px;
      vertical-align: top;
      font-size: 11px;
    }
    table.goods th {
      font-size: 9px;
      font-weight: 700;
      text-align: center;
      background: #fff;
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
      padding: 4px;
      border-top: none;
    }

    @media print {
      body { padding: 0; }
      .sheet { width: auto; border: none; }
      @page { size: A4; margin: 8mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top-note">${m.storeState ? `Subject to ${escapeHtml(m.storeState)} Jurisdiction` : ''}</div>

    <div class="inv-meta">
      <div class="left">
        <div class="label">Invoice No. <span class="value">${escapeHtml(m.invoiceNumber)}</span></div>
        <div class="ref">Ref. No.</div>
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

function openInvoiceFrame(html, title) {
  if (typeof document === 'undefined') return null;

  const existing = document.getElementById('invoice-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-print-frame';
  iframe.setAttribute('title', title || 'Invoice');
  Object.assign(iframe.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
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

/**
 * Optional programmatic PDF (best-effort). Prefer downloadInvoicePdf / printInvoice
 * for pixel-matching the Tally layout via browser print.
 */
export function downloadInvoicePdfFile(invoice, store) {
  if (!invoice || typeof window === 'undefined') return false;
  try {
    const m = buildInvoiceModel(invoice, store);
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`SUBJECT TO ${String(m.storeState).toUpperCase()} JURISDICTION`, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.text(`Invoice No. ${m.invoiceNumber}`, margin, y);
    doc.text(`Dated ${m.invoiceDate}`, pageW - margin, y, { align: 'right' });
    y += 8;
    doc.setFontSize(14);
    doc.text(String(m.storeName).toUpperCase(), pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (m.storeAddress) {
      const lines = doc.splitTextToSize(m.storeAddress, pageW - margin * 2);
      doc.text(lines, pageW / 2, y, { align: 'center' });
      y += lines.length * 3.5;
    }
    if (m.storeGst) {
      doc.text(`GSTIN/UIN: ${m.storeGst}`, pageW / 2, y, { align: 'center' });
      y += 3.5;
    }
    doc.text(`State Name : ${m.storeState}, Code : ${m.storeCode}`, pageW / 2, y, { align: 'center' });
    y += 3.5;
    if (m.storeEmail) {
      doc.text(`E-Mail : ${m.storeEmail}`, pageW / 2, y, { align: 'center' });
      y += 4;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INVOICE', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.text(`Party : ${m.partyName}`, margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`State Name : ${m.storeState}, Code : ${m.storeCode}`, margin, y);
    y += 6;

    m.rows.forEach((row, i) => {
      doc.text(`${i + 1}. ${getItemName(row.item)}`, margin, y);
      doc.text(formatAmount(row.taxableAmount), pageW - margin, y, { align: 'right' });
      y += 4;
    });
    y += 2;
    doc.text(`CGST ${formatAmount(m.cgstTotal)}`, pageW - margin, y, { align: 'right' });
    y += 4;
    doc.text(`SGST ${formatAmount(m.sgstTotal)}`, pageW - margin, y, { align: 'right' });
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total  Rs. ${formatAmount(m.grandTotal)}`, pageW - margin, y, { align: 'right' });
    y += 6;
    doc.setFontSize(8);
    doc.text(m.amountWords, margin, y);

    doc.save(`${String(m.invoiceNumber).replace(/[\\/:*?"<>|]/g, '_')}.pdf`);
    return true;
  } catch (err) {
    console.error('Unable to generate invoice PDF file', err);
    return false;
  }
}
