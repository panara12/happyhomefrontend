import JsBarcode from 'jsbarcode';

/**
 * TSC TA220 continuous labels — 2-across landscape stickers.
 * Paper: 120mm wide × 18mm feed. Each sticker: 51mm × 18mm.
 * Do NOT rotate in CSS — that makes the barcode print sideways and spill
 * across neighbouring stickers.
 */
export const BARCODE_STICKER_SPEC = {
  printer: 'TSC TA220',
  widthMm: 51,
  heightMm: 18,
  perRow: 2,
  paperWidthMm: 120,
  leftMarginMm: 7.5,
  gapMm: 3,
  dpi: 203,
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function formatStickerAmount(value) {
  return String(Math.round(Number(value) || 0));
}

function createBarcodeSvg(value) {
  if (!value) return '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    width: 1.4,
    height: 28,
  });
  return svg.outerHTML;
}

function createSticker(product) {
  const mrp = Number(product.mrp) || 0;
  const discount = Number(product.disc) || 0;
  const discountAmount = Number(product.disc_amt ?? (mrp * discount) / 100) || 0;
  const offerPrice = Number(product.offer_price ?? mrp - discountAmount) || 0;
  const barcode = String(product.barcode_text || '');
  const name = String(product.name || product.product_name || product.sku_code || '').trim();

  return `<article class="sticker">
    <strong class="brand">Happy Home</strong>
    <div class="barcode">${createBarcodeSvg(barcode)}</div>
    ${barcode ? `<span class="code">${escapeHtml(barcode)}</span>` : ''}
    ${name ? `<span class="name">${escapeHtml(name)}</span>` : ''}
    <div class="prices"><span>MRP:${formatStickerAmount(mrp)}</span><span>DISC:${formatStickerAmount(discount)}</span></div>
    <div class="prices"><span>DISC AMT:${formatStickerAmount(discountAmount)}</span><span>OFFER:${formatStickerAmount(offerPrice)}</span></div>
  </article>`;
}

export function printBarcodeStickers(selections) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return { ok: false, count: 0 };

  try {
    const stickers = selections.flatMap(({ product, quantity }) =>
      Array.from({ length: Math.max(0, Math.floor(Number(quantity) || 0)) }, () => createSticker(product))
    );
    if (stickers.length === 0) {
      printWindow.close();
      return { ok: false, count: 0 };
    }

    const {
      widthMm,
      heightMm,
      perRow,
      paperWidthMm,
      leftMarginMm,
      gapMm,
    } = BARCODE_STICKER_SPEC;

    const rows = [];
    for (let index = 0; index < stickers.length; index += perRow) {
      rows.push(
        `<section class="page"><div class="row">${stickers
          .slice(index, index + perRow)
          .join('')}</div></section>`
      );
    }

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <title>Barcode Stickers</title>
  <style>
    @page {
      size: ${paperWidthMm}mm ${heightMm}mm;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${paperWidthMm}mm;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: ${paperWidthMm}mm;
      height: ${heightMm}mm;
      page-break-after: always;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    .row {
      width: ${paperWidthMm}mm;
      height: ${heightMm}mm;
      display: flex;
      flex-direction: row;
      align-items: stretch;
      padding-left: ${leftMarginMm}mm;
      gap: ${gapMm}mm;
    }
    /* One sticker = one white label. Landscape: barcode reads left→right. */
    .sticker {
      width: ${widthMm}mm;
      height: ${heightMm}mm;
      flex: none;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2mm;
      padding: 0.4mm 1.2mm;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
    }
    .brand {
      font-size: 5.5pt;
      font-weight: 700;
      line-height: 1;
      text-align: center;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
    }
    .barcode {
      width: 46mm;
      height: 5.2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .barcode svg {
      width: 46mm !important;
      height: 5.2mm !important;
      max-width: 100%;
      display: block;
    }
    .code {
      font-size: 4.5pt;
      line-height: 1;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      max-width: 100%;
    }
    .name {
      font-size: 4.5pt;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      text-align: center;
    }
    .prices {
      width: 100%;
      display: flex;
      justify-content: space-between;
      font-size: 4pt;
      line-height: 1;
      white-space: nowrap;
    }
    @media screen {
      body { background: #ddd; padding: 12px; }
      .page {
        background: #fff;
        margin: 0 auto 10px;
        box-shadow: 0 1px 4px rgba(0,0,0,.2);
        outline: 1px dashed #999;
      }
      .sticker { outline: 1px solid #ccc; }
    }
  </style>
</head>
<body>${rows.join('')}</body>
</html>`);
    printWindow.document.close();
    return { ok: true, count: stickers.length };
  } catch {
    printWindow.close();
    return { ok: false, count: 0 };
  }
}
