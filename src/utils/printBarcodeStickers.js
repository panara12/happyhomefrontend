import JsBarcode from 'jsbarcode';

export const BARCODE_STICKER_SPEC = {
  printer: 'TSC TA220',
  widthMm: 50,
  heightMm: 26,
  perRow: 2,
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
    width: 1,
    height: 30,
  });
  return svg.outerHTML;
}

function createSticker(product, storeName) {
  const mrp = Number(product.mrp) || 0;
  const discount = Number(product.disc) || 0;
  const discountAmount = Number(product.disc_amt ?? (mrp * discount) / 100) || 0;
  const offerPrice = Number(product.offer_price ?? mrp - discountAmount) || 0;
  const barcodeValue = String(product.sku_code || '');
  const productText = String(product.barcode_text || '');

  return `<article class="sticker">
    <strong class="brand">${escapeHtml(storeName)}</strong>
    ${createBarcodeSvg(barcodeValue)}
    ${productText ? `<span class="code">${escapeHtml(productText)}</span>` : ''}
    <div class="prices"><span>MRP:${formatStickerAmount(mrp)}</span><span>DISC:${formatStickerAmount(discount)}</span></div>
    <div class="prices"><span>DISC AMT:${formatStickerAmount(discountAmount)}</span><span>OFFER:${formatStickerAmount(offerPrice)}</span></div>
  </article>`;
}

export function printBarcodeStickers(selections, storeName = 'Happy Home') {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return { ok: false, count: 0 };

  try {
    const stickers = selections.flatMap(({ product, quantity }) =>
      Array.from({ length: Math.max(0, Math.floor(Number(quantity) || 0)) }, () => createSticker(product, storeName))
    );
    if (stickers.length === 0) {
      printWindow.close();
      return { ok: false, count: 0 };
    }

    const rows = [];
    for (let index = 0; index < stickers.length; index += BARCODE_STICKER_SPEC.perRow) {
      rows.push(`<section class="row">${stickers.slice(index, index + BARCODE_STICKER_SPEC.perRow).join('')}</section>`);
    }

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    printWindow.document.write(`<!doctype html>
      <html><head><title>Barcode Stickers</title><style>
        @page { size: 126mm 26mm; margin: 0; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        .row { width: 126mm; height: 26mm; display: flex; align-items: stretch; gap: 10mm; padding-left: 7.5mm; page-break-after: always; }
        .sticker { width: 50mm; height: 26mm; flex: none; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 0.5mm; padding: 0 1mm 0.3mm; font: 5pt Arial, sans-serif; font-weight: bold; }
        .brand { font-size: 7pt; line-height: 1; }
        .sticker svg { width: 42mm; height: 5mm; }
        .code { font-size: 10pt; line-height: 1; }
        .prices { width: 100%; display: flex; justify-content: space-between; font-size: 8pt; line-height: 1; white-space: nowrap; }
        @media screen { body { background: #eee; } .row { background: white; margin: 8px auto; } }
      </style></head><body>${rows.join('')}</body></html>`);
    printWindow.document.close();
    return { ok: true, count: stickers.length };
  } catch {
    printWindow.close();
    return { ok: false, count: 0 };
  }
}
