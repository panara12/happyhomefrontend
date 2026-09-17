import logoImg from '../assets/logo.jpg';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function getItemName(item) {
  return item?.productName || item?.productCode || item?.item?.name || 'Item';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Round money up to next whole rupee. */
function roundUp(value) {
  return Math.ceil(Number(value) || 0);
}

/** Price on invoice is GST-inclusive final selling price — split for PDF columns. */
function getLineBreakdown(item) {
  const qty = Number(item.quantity) || 0;
  const gstRate = Number(item.gst) || 0;
  const lineTotalInc = roundUp(
    item.total !== undefined && item.total !== null
      ? Number(item.total)
      : qty * Number(item.price || 0)
  );
  const lineTotalExRaw = gstRate > 0 ? lineTotalInc / (1 + gstRate / 100) : lineTotalInc;
  const lineTotalEx = roundUp(lineTotalExRaw);
  const unitPriceEx = roundUp(qty > 0 ? lineTotalExRaw / qty : lineTotalExRaw);
  const gstAmount = roundUp(Math.max(0, lineTotalInc - lineTotalExRaw));

  return {
    qty,
    gstRate,
    unitPriceEx,
    gstAmount,
    lineTotalEx,
    lineTotalInc,
  };
}

function buildInvoiceHtml(invoice, store) {
  const items = invoice.items || [];
  const payment = invoice.paymentBreakdown || {};
  const hasPayment =
    Number(payment.cash || 0) > 0 ||
    Number(payment.gpay || 0) > 0 ||
    Number(payment.debit || 0) > 0;

  const breakdowns = items.map((item) => ({
    item,
    ...getLineBreakdown(item),
  }));

  const sumExGst = roundUp(breakdowns.reduce((sum, row) => sum + row.lineTotalEx, 0));
  const sumGst = roundUp(breakdowns.reduce((sum, row) => sum + row.gstAmount, 0));
  const sumTotal = roundUp(
    breakdowns.reduce((sum, row) => sum + row.lineTotalInc, 0)
  );
  const totalAmount = roundUp(invoice.total ?? sumTotal);

  const storeName = store?.name || 'Happy Home';
  const storeAddress = store?.address || '';
  const storeMobile = store?.number != null && store?.number !== '' ? String(store.number) : '';
  const storeGst = store?.gstNumber || '';

  const rowsHtml = breakdowns
    .map(
      ({ item, qty, unitPriceEx, gstAmount, lineTotalInc }, index) => `
      <tr>
        <td class="center muted">${index + 1}</td>
        <td>${escapeHtml(getItemName(item))}</td>
        <td class="center">${escapeHtml(qty)}</td>
        <td class="right">${escapeHtml(formatMoney(unitPriceEx))}</td>
        <td class="right">${escapeHtml(formatMoney(gstAmount))}</td>
        <td class="right">${escapeHtml(formatMoney(lineTotalInc))}</td>
      </tr>`
    )
    .join('');

  const paymentHtml = hasPayment
    ? `
      <div class="payment-box">
        <div class="section-title">Payment Mode</div>
        <div class="payment-grid">
          <div><span>Cash</span><strong>${escapeHtml(formatMoney(roundUp(payment.cash)))}</strong></div>
          <div><span>GPay</span><strong>${escapeHtml(formatMoney(roundUp(payment.gpay)))}</strong></div>
          <div><span>Debit</span><strong>${escapeHtml(formatMoney(roundUp(payment.debit)))}</strong></div>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #1f2937;
      margin: 0;
      padding: 28px;
      background: #fff;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 22px 24px;
      background: linear-gradient(135deg, #fff7ed 0%, #ffffff 55%);
      border-bottom: 2px solid #f59e0b;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand img {
      width: 52px;
      height: 52px;
      object-fit: contain;
      border-radius: 8px;
    }
    .brand h1 {
      margin: 0;
      font-size: 22px;
      color: #9a3412;
      letter-spacing: 0.2px;
    }
    .brand .tag {
      margin: 2px 0 0;
      font-size: 11px;
      color: #78716c;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta .badge {
      display: inline-block;
      background: #9a3412;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .invoice-meta .meta-line {
      font-size: 12px;
      color: #57534e;
      margin: 3px 0;
    }
    .invoice-meta .meta-line strong { color: #1c1917; }

    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .party {
      padding: 16px 24px;
    }
    .party + .party {
      border-left: 1px solid #e5e7eb;
      background: #fafaf9;
    }
    .party h3 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #a8a29e;
    }
    .party .name {
      font-size: 15px;
      font-weight: 700;
      color: #1c1917;
      margin-bottom: 6px;
    }
    .party p {
      margin: 3px 0;
      font-size: 12px;
      color: #44403c;
      line-height: 1.45;
    }

    .body { padding: 18px 24px 22px; }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    thead th {
      background: #1c1917;
      color: #fff;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 10px 8px;
      text-align: left;
      font-weight: 600;
    }
    tbody td, tfoot td {
      padding: 9px 8px;
      font-size: 12px;
      border-bottom: 1px solid #ececec;
    }
    tbody tr:nth-child(even) { background: #fafaf9; }
    th.right, td.right { text-align: right; }
    th.center, td.center { text-align: center; }
    .muted { color: #78716c; }
    tfoot td {
      font-weight: 700;
      background: #fff7ed;
      border-bottom: none;
      border-top: 2px solid #f59e0b;
      font-size: 12px;
      font-family: "Segoe UI", Arial, sans-serif;
    }
    tfoot tr.grand-total td {
      background: #fff;
      border-top: 1px solid #e7e5e4;
      font-size: 14px;
      font-weight: 700;
      color: #1c1917;
      padding-top: 12px;
      padding-bottom: 12px;
    }
    tfoot tr.grand-total td.amount {
      color: #9a3412;
      text-align: right;
    }

    .payment-wrap {
      margin-top: 16px;
    }
    .payment-box {
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 12px 14px;
      background: #fafaf9;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #a8a29e;
      margin-bottom: 8px;
      font-weight: 700;
    }
    .payment-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .payment-grid div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
    }
    .payment-grid span { color: #78716c; }
    .payment-grid strong { color: #1c1917; }

    @media print {
      body { padding: 0; }
      .sheet { border: none; border-radius: 0; max-width: none; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">
      <div class="brand">
        <img src="${logoImg}" alt="Happy Home" />
        <div>
          <h1>Happy Home</h1>
          <p class="tag">Tax Invoice</p>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="badge">${escapeHtml(invoice.invoiceNumber || '—')}</div>
        <div class="meta-line">Date: <strong>${escapeHtml(formatDate(invoice.createdAt))}</strong></div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>Bill To</h3>
        <div class="name">${escapeHtml(invoice.customerName || '—')}</div>
        <p>Phone: ${escapeHtml(invoice.customerPhone || '—')}</p>
      </div>
      <div class="party">
        <h3>Store Details</h3>
        <div class="name">${escapeHtml(storeName)}</div>
        ${storeAddress ? `<p>${escapeHtml(storeAddress)}</p>` : ''}
        ${storeMobile ? `<p>Mobile: ${escapeHtml(storeMobile)}</p>` : ''}
        ${storeGst ? `<p>GSTIN: ${escapeHtml(storeGst)}</p>` : ''}
      </div>
    </div>

    <div class="body">
      <table>
        <thead>
          <tr>
            <th class="center" style="width:36px">#</th>
            <th>Product</th>
            <th class="center">Qty</th>
            <th class="right">Price (Excluding GST)</th>
            <th class="right">GST Amount</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="6" class="center">No items</td></tr>'}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="right">All items total</td>
            <td class="right">${escapeHtml(formatMoney(sumExGst))}</td>
            <td class="right">${escapeHtml(formatMoney(sumGst))}</td>
            <td class="right">${escapeHtml(formatMoney(sumTotal))}</td>
          </tr>
          <tr class="grand-total">
            <td colspan="5" class="right">Total Amount</td>
            <td class="right amount">${escapeHtml(formatMoney(totalAmount))}</td>
          </tr>
        </tfoot>
      </table>

      ${hasPayment ? `<div class="payment-wrap">${paymentHtml}</div>` : ''}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Prints a single invoice via a hidden iframe (no pop-up required).
 * @param {object} invoice
 * @param {object} [store] optional store record (name, address, number, gstNumber, storeId)
 */
export function printInvoice(invoice, store) {
  if (!invoice || typeof document === 'undefined') return false;

  const existing = document.getElementById('invoice-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'invoice-print-frame';
  iframe.setAttribute('title', `Print ${invoice.invoiceNumber || 'invoice'}`);
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!frameDoc) {
    iframe.remove();
    return false;
  }

  frameDoc.open();
  frameDoc.write(buildInvoiceHtml(invoice, store));
  frameDoc.close();

  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.remove();
      }, 1000);
    }
  };

  const images = Array.from(frameDoc.images || []);
  if (images.length === 0) {
    setTimeout(triggerPrint, 50);
    return true;
  }

  let loaded = 0;
  const done = () => {
    loaded += 1;
    if (loaded >= images.length) setTimeout(triggerPrint, 50);
  };

  images.forEach((img) => {
    if (img.complete) done();
    else {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
  });

  setTimeout(triggerPrint, 1500);

  return true;
}
