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

/** Whole-number display like the reference sticker (1050, 50, 520…) */
function num(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return String(Math.round(n));
}

function resolvePricing(product) {
  const mrp = Number(product?.mrp) || 0;
  const disc = Number(product?.disc) || 0;
  let discAmt = Number(product?.dict_amt);
  if (!Number.isFinite(discAmt) || discAmt < 0) {
    discAmt = Number(((mrp * disc) / 100).toFixed(2));
  }
  let offer = Number(product?.offer_price);
  if (!Number.isFinite(offer) || offer < 0) {
    offer = Math.max(0, mrp - discAmt);
  }
  return { mrp, disc, discAmt, offer };
}

/** Build CODE128 SVG markup for a barcode value */
function buildBarcodeSvg(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  try {
    JsBarcode(svg, text, {
      format: 'CODE128',
      width: 1.2,
      height: 36,
      displayValue: false,
      margin: 0,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      background: '#ffffff',
      lineColor: '#000000',
    });
  } catch {
    return '';
  }
  svg.setAttribute('width', '90%');
  svg.setAttribute('height', '36');
  svg.setAttribute('preserveAspectRatio', 'xMidYMin meet');
  svg.setAttribute('style', 'display:block;margin:0;padding:0;');
  return svg.outerHTML;
}

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
  const { mrp, disc, discAmt, offer } = resolvePricing(product);
  const barcodeSvg = buildBarcodeSvg(code);

  return `
    <div class="sticker">
      <div class="sticker-inner">
        <div class="header">Happy Home</div>

        <div class="barcode-block">
          <div class="barcode-wrap">
            ${barcodeSvg || `<div class="barcode-fallback">${escapeHtml(code)}</div>`}
          </div>
          <div class="code">${escapeHtml(code)}</div>
        </div>

        <div class="price-block">
          <table class="price-table" cellspacing="0" cellpadding="0">
            <tr>
              <td class="price-cell">
                <div class="price-label">MRP</div>
                <div class="price-value">${escapeHtml(num(mrp))}</div>
              </td>
              <td class="price-cell">
                <div class="price-label">DISC</div>
                <div class="price-value">${escapeHtml(num(disc))}</div>
              </td>
            </tr>
            <tr>
              <td class="price-cell">
                <div class="price-label">DISC AMT</div>
                <div class="price-value">${escapeHtml(num(discAmt))}</div>
              </td>
              <td class="price-cell price-cell-offer">
                <div class="price-label">OFFER PRICE</div>
                <div class="price-value">${escapeHtml(num(offer))}</div>
              </td>
            </tr>
          </table>
        </div>
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
      margin: 0;
      padding: 0;
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
      padding: 0.04in 0.04in 0.03in;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      gap: 0.02in;
      font-family: Arial, Helvetica, sans-serif;
    }
    .header {
      flex: 0 0 auto;
      font-size: 8.5pt;
      font-weight: 700;
      text-align: center;
      line-height: 1.05;
      margin: 0;
      padding: 0;
    }
    .barcode-block {
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 0;
      margin: 0;
      padding: 0;
      line-height: 0;
    }
    .barcode-wrap {
      flex: 0 0 auto;
      width: 100%;
      height: auto;
      display: block;
      line-height: 0;
      font-size: 0;
      margin: 0;
      padding: 0;
    }
    .barcode-wrap svg {
      width: 90%;
      height: 0.4in;
      display: block;
      margin: 0 auto;
      padding: 0;
    }
    .barcode-fallback {
      font-size: 7pt;
      line-height: 1.1;
      word-break: break-all;
      text-align: center;
    }
    .code {
      flex: 0 0 auto;
      font-size: 7.5pt;
      font-weight: 700;
      text-align: center;
      line-height: 1;
      margin: 0;
      padding: 0;
      max-height: 0.22in;
      overflow: hidden;
      word-break: break-word;
    }
    .price-block {
      flex: 0 0 auto;
      width: 100%;
      margin-top: 0.04in;
    }
    .price-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .price-table td {
      vertical-align: top;
      text-align: center;
      padding: 0.03in 0.015in 0;
    }
    .price-table tr:first-child td {
      width: 50%;
    }
    .price-table tr:last-child td:first-child {
      width: 40%;
    }
    .price-table tr:last-child td.price-cell-offer {
      width: 60%;
    }
    .price-label {
      font-size: 5.5pt;
      font-weight: 700;
      line-height: 1.1;
      border-bottom: 0.75pt solid #000;
      display: block;
      width: 100%;
      padding: 0 0 0.6pt;
      margin: 0 0 1.5pt;
      white-space: nowrap;
      overflow: visible;
      letter-spacing: 0;
    }
    .price-cell-offer .price-label {
      font-size: 5pt;
      letter-spacing: -0.015em;
    }
    .price-value {
      font-size: 8.5pt;
      font-weight: 700;
      line-height: 1.15;
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
