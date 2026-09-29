import JsBarcode from 'jsbarcode';

/** Single sticker: 1" wide × 2" tall. Two stickers per row for TSC TA220. */
const STICKER_W_IN = 1;
const STICKER_H_IN = 2;
const COLS = 2;
const ROW_W_IN = STICKER_W_IN * COLS; // 2"
const ROW_H_IN = STICKER_H_IN; // 2"

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `₹${n.toLocaleString('en-IN')}`;
}

/** Build CODE128 SVG markup for a barcode value */
function buildBarcodeSvg(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try {
    JsBarcode(svg, text, {
      format: 'CODE128',
      width: 1.1,
      height: 48,
      displayValue: false,
      margin: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });
  } catch {
    // Invalid barcode content — show text-only sticker
    return '';
  }
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '48');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return svg.outerHTML;
}

/**
 * Expand selected products + quantities into flat sticker list.
 * @param {Array<{ product: object, quantity: number }>} selections
 */
function expandStickers(selections) {
  const stickers = [];
  for (const { product, quantity } of selections) {
    const qty = Math.max(0, Number(quantity) || 0);
    for (let i = 0; i < qty; i += 1) {
      stickers.push(product);
    }
  }
  return stickers;
}

function chunkRows(stickers, cols = COLS) {
  const rows = [];
  for (let i = 0; i < stickers.length; i += cols) {
    rows.push(stickers.slice(i, i + cols));
  }
  return rows;
}

function stickerHtml(product) {
  const code = product?.barcode_text || product?.sku_code || product?.product_code || '';
  const mrp = money(product?.mrp || product?.offer_price);
  const brand =
    typeof product?.brand === 'object'
      ? product.brand?.name
      : '';
  const barcodeSvg = buildBarcodeSvg(code);

  return `
    <div class="sticker">
      <div class="sticker-inner">
        <div class="brand">${escapeHtml(brand || 'Happy Home')}</div>
        <div class="barcode-wrap">
          ${barcodeSvg || `<div class="barcode-fallback">${escapeHtml(code)}</div>`}
        </div>
        <div class="code">${escapeHtml(code)}</div>
        ${mrp ? `<div class="mrp">MRP ${escapeHtml(mrp)}</div>` : ''}
      </div>
    </div>
  `;
}

function buildPrintHtml(stickers) {
  const rows = chunkRows(stickers, COLS);
  const rowsHtml = rows
    .map((row) => {
      const cells = [];
      for (let c = 0; c < COLS; c += 1) {
        cells.push(row[c] ? stickerHtml(row[c]) : '<div class="sticker empty"></div>');
      }
      return `<div class="row">${cells.join('')}</div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Barcode Stickers — TSC TA220</title>
  <style>
    @page {
      size: ${ROW_W_IN}in ${ROW_H_IN}in;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${ROW_W_IN}in;
      background: #fff;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .row {
      display: flex;
      flex-direction: row;
      width: ${ROW_W_IN}in;
      height: ${ROW_H_IN}in;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }
    .row:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .sticker {
      width: ${STICKER_W_IN}in;
      height: ${STICKER_H_IN}in;
      overflow: hidden;
    }
    .sticker.empty { visibility: hidden; }
    .sticker-inner {
      width: 100%;
      height: 100%;
      padding: 0.06in 0.04in;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      text-align: center;
      font-family: Arial, Helvetica, sans-serif;
    }
    .brand {
      font-size: 7pt;
      font-weight: 700;
      line-height: 1.1;
      max-height: 0.28in;
      overflow: hidden;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .barcode-wrap {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0.7in;
    }
    .barcode-wrap svg {
      max-width: 0.92in;
      height: auto;
      max-height: 0.85in;
    }
    .barcode-fallback {
      font-size: 8pt;
      word-break: break-all;
      padding: 0.05in;
    }
    .code {
      font-size: 7.5pt;
      font-weight: 700;
      line-height: 1.15;
      max-width: 100%;
      overflow: hidden;
      word-break: break-all;
    }
    .mrp {
      font-size: 8pt;
      font-weight: 700;
      line-height: 1.1;
      margin-top: 0.02in;
    }
    @media screen {
      body {
        padding: 12px;
        background: #e5e7eb;
        width: auto;
      }
      .row {
        margin: 0 auto 12px;
        background: #fff;
        box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  ${rowsHtml}
</body>
</html>`;
}

function openPrintFrame(html) {
  const existing = document.getElementById('barcode-sticker-print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'barcode-sticker-print-frame';
  iframe.setAttribute('title', 'Barcode Stickers');
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
      }, 1000);
    }
  };

  // Wait a tick so SVG barcodes paint before print dialog
  if (iframe.contentDocument?.readyState === 'complete') {
    setTimeout(run, 150);
  } else {
    iframe.onload = () => setTimeout(run, 150);
    setTimeout(run, 400);
  }
  return true;
}

/**
 * Print barcode stickers for TSC TA220.
 * Label: 1" (H) × 2" (V), 2 stickers per row.
 *
 * @param {Array<{ product: object, quantity: number }>} selections
 * @returns {{ ok: boolean, count: number }}
 */
export function printBarcodeStickers(selections) {
  const stickers = expandStickers(selections || []);
  if (stickers.length === 0) {
    return { ok: false, count: 0 };
  }

  const html = buildPrintHtml(stickers);
  const iframe = openPrintFrame(html);
  const ok = triggerFramePrint(iframe);
  return { ok, count: stickers.length };
}

export const BARCODE_STICKER_SPEC = {
  printer: 'TSC TA220',
  widthIn: STICKER_W_IN,
  heightIn: STICKER_H_IN,
  perRow: COLS,
  dpi: 203,
};
