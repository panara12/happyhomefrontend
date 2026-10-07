import JsBarcode from "jsbarcode";

export const BARCODE_STICKER_SPEC = {
    printer: "TSC TA220",
    widthMm: 50,
    heightMm: 26,
    perRow: 2,
    dpi: 203,
};

function escapeHtml(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (character) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
            })[character],
    );
}

function formatStickerAmount(value) {
    return String(Math.round(Number(value) || 0));
}

const DOT_MM = 25.4 / BARCODE_STICKER_SPEC.dpi;   // 0.125 mm per dot
const MAX_BARCODE_MM = 40;                         // 50mm sticker, ~5mm quiet zone each side
const BARCODE_HEIGHT_MM = 6;

function createBarcodeSvg(value) {
    if (!value) return "";

    // measure total modules at 1px per module
    const probe = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(probe, value, { format: "CODE128", displayValue: false, margin: 0, width: 1, height: 1 });
    const modules = parseFloat(probe.getAttribute("width"));

    // 3 dots per module if it fits, else 2, else 1 (always whole dots)
    const maxDots = Math.floor(MAX_BARCODE_MM / DOT_MM);           // 320 dots
    const moduleDots = Math.max(1, Math.min(3, Math.floor(maxDots / modules)));
    if (moduleDots < 2) console.warn(`SKU "${value}" is too long for a reliable scan`);

    const heightDots = Math.round(BARCODE_HEIGHT_MM / DOT_MM);     // 72 dots
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    JsBarcode(svg, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: moduleDots,
        height: heightDots,
    });

    const w = modules * moduleDots;
    svg.setAttribute("viewBox", `0 0 ${w} ${heightDots}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("shape-rendering", "crispEdges");
    svg.setAttribute("style", `width:${(w * DOT_MM).toFixed(3)}mm;height:${BARCODE_HEIGHT_MM}mm;display:block;flex:none`);
    return svg.outerHTML;
}

function createSticker(product, storeName) {
    const mrp = Number(product.mrp) || 0;
    const discount = Number(product.disc) || 0;
    const discountAmount =
        Number(product.disc_amt ?? (mrp * discount) / 100) || 0;
    const offerPrice = Number(product.offer_price ?? mrp - discountAmount) || 0;
    const barcodeValue = String(product.sku_code || "");
    const productText = String(product.barcode_text || "");

    return `<article class="sticker">
    <strong class="brand">${escapeHtml(storeName)}</strong>
    ${createBarcodeSvg(barcodeValue)}
    ${productText ? `<span class="code">${escapeHtml(productText)}</span>` : ""}
    <div class="prices"><span>MRP:${formatStickerAmount(mrp)}</span><span>DISC:${formatStickerAmount(discount)}</span></div>
    <div class="prices"><span>DISC AMT:${formatStickerAmount(discountAmount)}</span><span>OFFER:${formatStickerAmount(offerPrice)}</span></div>
  </article>`;
}

export function printBarcodeStickers(selections, storeName = "Happy Home") {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return { ok: false, count: 0 };

    try {
        const stickers = selections.flatMap(({ product, quantity }) =>
            Array.from(
                { length: Math.max(0, Math.floor(Number(quantity) || 0)) },
                () => createSticker(product, storeName),
            ),
        );
        if (stickers.length === 0) {
            printWindow.close();
            return { ok: false, count: 0 };
        }

        const rows = [];
        for (
            let index = 0;
            index < stickers.length;
            index += BARCODE_STICKER_SPEC.perRow
        ) {
            rows.push(
                `<section class="row">${stickers.slice(index, index + BARCODE_STICKER_SPEC.perRow).join("")}</section>`,
            );
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
        .row { 
          width: 126mm; 
          height: 26mm; 
          display: flex; 
          align-items: stretch; 
          gap: 10mm; 
          padding-left: 7.5mm; 
          page-break-after: always; 
          }
        .sticker {
  width: 50mm;
  height: 26mm;
  flex: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0.3mm;
  padding: 0mm 1mm 1.5mm;
  font: bold 5pt Arial, sans-serif;
}
        .brand {
  font-size: 8pt;
  line-height: 1;
}
        .code {
  width: 100%;
  padding-bottom: 0.5mm;
  font-size: 8pt;
  font-weight: bold;
  line-height: 1;
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
}
        .prices {
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-size: 7pt;
  line-height: 1.05;
  white-space: nowrap;
}
        @media screen { body { background: #eee; } 
        .row { background: white; margin: 8px auto; } }
      </style></head><body>${rows.join("")}</body></html>`);
        printWindow.document.close();
        return { ok: true, count: stickers.length };
    } catch {
        printWindow.close();
        return { ok: false, count: 0 };
    }
}
