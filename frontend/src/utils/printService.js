/**
 * Browser-based POS Thermal Receipt Printing Service for Pizza Town
 * Formatted specifically for 80mm thermal receipt paper (Epson TM-m30II)
 * Optimized for heavy thickness, maximum contrast, and deep black thermal printhead burning.
 */

const RESTAURANT_INFO = {
  name: 'PIZZA TOWN',
  address: 'Stationsstraat 14, 1861 Meise',
  phone: '02 269 71 76',
  tagline: 'Verse pizza\'s & authentieke smaak'
};

/**
 * Format currency with 2 decimal places
 */
const formatPrice = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '€ 0.00' : `€ ${num.toFixed(2)}`;
};

/**
 * Format date/time in Belgian Dutch locale
 */
const formatDateTime = (dateStr) => {
  try {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleString('nl-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr || '';
  }
};

/**
 * Generate CSS styles for thermal receipt printing
 * Uses heavy typography, text-stroke for ink density, and zero gray dithering
 */
const getReceiptStyles = () => `
  @page {
    size: 80mm auto;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    color: #000000 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    /* Thick, solid sans-serif prevents thin serif stem fading on thermal printheads */
    font-family: Arial, "Helvetica Neue", Helvetica, "Segoe UI", sans-serif;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
    color: #000000 !important;
    background: #ffffff !important;
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 4mm 5mm 24mm 5mm;
    /* Extra micro-stroke to reinforce font stem thickness for thermal heads */
    -webkit-text-stroke: 0.25px #000000;
    text-rendering: geometricPrecision;
  }
  .center {
    text-align: center;
  }
  .left {
    text-align: left;
  }
  .right {
    text-align: right;
  }
  .bold {
    font-weight: 900 !important;
  }
  .title {
    font-size: 24px;
    font-weight: 900 !important;
    letter-spacing: 1px;
    margin-bottom: 3px;
    -webkit-text-stroke: 0.5px #000000;
  }
  .subtitle {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 2px;
  }
  .badge {
    display: inline-block;
    border: 3px solid #000000;
    padding: 4px 10px;
    font-size: 17px;
    font-weight: 900 !important;
    margin: 7px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    -webkit-text-stroke: 0.4px #000000;
  }
  .timing-box {
    font-size: 15px;
    font-weight: 900 !important;
    margin-top: 3px;
    margin-bottom: 4px;
    -webkit-text-stroke: 0.3px #000000;
  }
  .divider {
    border-top: 2px solid #000000;
    margin: 8px 0;
  }
  .divider-double {
    border-top: 3px double #000000;
    margin: 8px 0;
  }
  .divider-thick {
    border-top: 3px solid #000000;
    margin: 8px 0;
  }
  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .flex-between span:first-child {
    flex: 1;
    padding-right: 8px;
    word-break: break-word;
  }
  .flex-between span:last-child {
    white-space: nowrap;
    text-align: right;
    font-weight: 800;
  }
  .order-meta {
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 5px;
  }
  .customer-box {
    margin: 6px 0;
    font-size: 13.5px;
    font-weight: 800;
    line-height: 1.4;
  }
  .item-row {
    margin: 7px 0;
  }
  .item-name {
    font-weight: 900 !important;
    font-size: 15px;
    -webkit-text-stroke: 0.3px #000000;
  }
  .item-price {
    font-weight: 900 !important;
    font-size: 15px;
  }
  .item-customizations {
    padding-left: 12px;
    font-size: 12.5px;
    font-weight: 700;
    line-height: 1.35;
    margin-top: 2px;
  }
  .subitem {
    font-weight: 800;
    margin-top: 3px;
    font-size: 13px;
  }
  .total-row {
    font-size: 19px;
    font-weight: 900 !important;
    margin-top: 6px;
    -webkit-text-stroke: 0.4px #000000;
  }
  .notes-box {
    border: 2px solid #000000;
    padding: 6px 8px;
    margin: 8px 0;
    font-size: 13px;
    font-weight: 800;
  }
  .footer {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    margin-top: 12px;
    line-height: 1.4;
  }
  .cut-space {
    height: 20mm;
  }
`;

/**
 * Generate HTML string for an order
 */
export const generateReceiptHtml = (order) => {
  const items = order.items || order.orderitems || [];
  const deliveryType = (order.delivery_type || '').toLowerCase();
  const isDineIn = ['dine_in', 'dine-in', 'restaurant', 'eat_in', 'sur_place', 'ter_plaatse', 'ter plaatse'].includes(deliveryType);
  const isTakeaway = deliveryType === 'takeaway';
  const isDelivery = !isDineIn && !isTakeaway;

  // Belgian HoReCa VAT rules:
  // - Delivery & Takeaway: 6% TVA on food
  // - Dine-in (Eat in restaurant): 12% TVA
  const tvaRate = isDineIn ? 0.12 : 0.06;
  const tvaPercentStr = isDineIn ? '12%' : '6%';

  const customerName = order.users?.full_name || order.customer_name || 'Klant';
  const customerPhone = order.users?.phone_number || order.phone || '';
  const customerAddress = order.delivery_address || order.users?.address || '';
  const orderShortId = (order.order_id || '').split('-')[0].toUpperCase();
  const notes = order.delivery_notes || order.notes || '';
  
  const totalPrice = parseFloat(order.total_price || 0);
  const deliveryFee = parseFloat(order.delivery_fee || 0);
  const subtotal = Math.max(0, totalPrice - deliveryFee);

  // In Belgium all prices are TTC (inclusive of TVA)
  // Base HT = Total / (1 + rate)
  // Montant TVA = Total - Base HT
  const baseHt = totalPrice / (1 + tvaRate);
  const tvaAmount = totalPrice - baseHt;

  let badgeText = '★ BEZORGING ★';
  let timingText = 'LEVERTIJD: CA. 45-60 MIN';
  if (isDineIn) {
    badgeText = '★ TER PLAATSE (RESTAURANT) ★';
    timingText = 'ETEN IN RESTAURANT • BTW 12%';
  } else if (isTakeaway) {
    badgeText = '★ AFHALEN ★';
    timingText = `AFHAALTIJD: ${order.pickup_time && order.pickup_time.toLowerCase() !== 'asap' ? order.pickup_time : 'ZO SNEL MOGELIJK'}`;
  }

  let itemsHtml = '';
  items.forEach((item) => {
    const qty = parseInt(item.quantity) || 1;
    const itemName = item.menuitems?.name || item.name || 'Onbekend Item';
    
    // Price calculations
    let itemTotal = 0;
    if (item.subtotal) {
      itemTotal = parseFloat(item.subtotal);
    } else if (item.price || item.menuitems?.price) {
      itemTotal = parseFloat(item.price || item.menuitems?.price) * qty;
    }

    const cust = item.customizations || {};

    let detailsHtml = '';
    // Format / Size
    if (cust.size) {
      const sizeName = cust.size.name || cust.size.id || cust.size;
      detailsHtml += `<div>• Formaat: <strong>${sizeName.toUpperCase()}</strong></div>`;
    }
    // Crust / Bodem
    if (cust.crust) {
      const crustName = cust.crust.name || cust.crust;
      detailsHtml += `<div>• Bodem: <strong>${crustName}</strong></div>`;
    }
    // Toppings
    if (cust.toppings && Array.isArray(cust.toppings) && cust.toppings.length > 0) {
      detailsHtml += `<div>• Toppings: <strong>${cust.toppings.join(', ')}</strong></div>`;
    }
    // Deal sub items
    if (cust.subItems && Array.isArray(cust.subItems)) {
      cust.subItems.forEach((sub) => {
        detailsHtml += `<div class="subitem">  - ${sub.quantity > 1 ? `${sub.quantity}x ` : ''}${sub.name}</div>`;
        if (sub.customizations) {
          if (sub.customizations.size) {
            detailsHtml += `<div style="padding-left: 12px;">> Formaat: <strong>${sub.customizations.size.name || sub.customizations.size.id}</strong></div>`;
          }
          if (sub.customizations.crust) {
            detailsHtml += `<div style="padding-left: 12px;">> Bodem: <strong>${sub.customizations.crust.name || sub.customizations.crust}</strong></div>`;
          }
          if (sub.customizations.toppings?.length) {
            detailsHtml += `<div style="padding-left: 12px;">> Toppings: <strong>${sub.customizations.toppings.join(', ')}</strong></div>`;
          }
        }
      });
    }
    // Extras
    if (cust.extras && Array.isArray(cust.extras)) {
      cust.extras.forEach((extra) => {
        detailsHtml += `<div>+ <strong>${extra.name || extra}</strong></div>`;
      });
    }

    itemsHtml += `
      <div class="item-row">
        <div class="flex-between">
          <span class="item-name">${qty}x ${itemName}</span>
          <span class="item-price">${formatPrice(itemTotal)}</span>
        </div>
        ${detailsHtml ? `<div class="item-customizations">${detailsHtml}</div>` : ''}
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <title>Bon #${orderShortId}</title>
      <style>${getReceiptStyles()}</style>
    </head>
    <body>
      <div class="center">
        <div class="title">${RESTAURANT_INFO.name}</div>
        <div class="subtitle">${RESTAURANT_INFO.address}</div>
        <div class="subtitle">Tel: ${RESTAURANT_INFO.phone}</div>
        <div class="divider"></div>
        <div class="badge">${badgeText}</div>
        <div class="timing-box">
          ${timingText}
        </div>
      </div>

      <div class="divider"></div>

      <div class="order-meta">
        <div class="flex-between">
          <span>Bestelling: <strong style="font-size: 15px;">#${orderShortId}</strong></span>
          <span>${formatDateTime(order.created_at)}</span>
        </div>
      </div>

      <div class="customer-box">
        <div>Klant: <strong>${customerName}</strong></div>
        ${customerPhone ? `<div>Tel: <strong>${customerPhone}</strong></div>` : ''}
        ${!isDineIn && customerAddress && customerAddress !== 'N/A' ? `<div>Adres: <strong>${customerAddress}</strong></div>` : ''}
        ${isDineIn ? `<div>Plaats: <strong>In Restaurant (Tafel)</strong></div>` : ''}
      </div>

      <div class="divider-thick"></div>
      <div class="flex-between bold" style="font-size: 13px; margin-bottom: 4px;">
        <span>ARTIKEL</span>
        <span>PRIJS</span>
      </div>
      <div class="divider"></div>

      ${itemsHtml || '<div class="center bold">Geen artikelen</div>'}

      <div class="divider"></div>

      <div class="flex-between" style="font-size: 14px;">
        <span>Subtotaal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>

      ${deliveryFee > 0 ? `
        <div class="flex-between" style="font-size: 14px;">
          <span>Bezorgkosten</span>
          <span>${formatPrice(deliveryFee)}</span>
        </div>
      ` : ''}

      <div class="divider-thick"></div>

      <div class="flex-between total-row">
        <span>TOTAAL (INCL. BTW)</span>
        <span>${formatPrice(totalPrice)}</span>
      </div>

      <div class="divider-thick"></div>

      <!-- Belgian Legal TVA / BTW Breakdown Box -->
      <div style="font-size: 13px; font-weight: 800; margin: 6px 0;">
        <div class="flex-between" style="border-bottom: 2px solid #000; padding-bottom: 3px; margin-bottom: 4px;">
          <span>BTW TARIEF</span>
          <span>NETTO (EXCL.)</span>
          <span>BTW BEDRAG</span>
        </div>
        <div class="flex-between">
          <span>${tvaPercentStr} (${isDineIn ? 'Restaurant' : isTakeaway ? 'Afhalen' : 'Levering'})</span>
          <span>${formatPrice(baseHt)}</span>
          <span>${formatPrice(tvaAmount)}</span>
        </div>
      </div>

      <div class="divider"></div>

      ${notes ? `
        <div class="notes-box">
          <div class="bold" style="margin-bottom: 2px;">OPMERKINGEN:</div>
          <div>${notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div class="bold" style="font-size: 14px;">Bedankt voor uw bestelling!</div>
        <div style="font-size: 13px;">Smakelijk eten!</div>
        <div style="font-size: 11px; margin-top: 6px; font-weight: 800;">*** Pizza Town Meise ***</div>
      </div>

      <div class="cut-space"></div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML string for test print
 */
export const generateTestReceiptHtml = () => {
  return `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
      <meta charset="UTF-8">
      <title>Test Print</title>
      <style>${getReceiptStyles()}</style>
    </head>
    <body>
      <div class="center">
        <div class="title">${RESTAURANT_INFO.name}</div>
        <div class="subtitle">${RESTAURANT_INFO.address}</div>
        <div class="subtitle">Tel: ${RESTAURANT_INFO.phone}</div>
        <div class="divider-thick"></div>
        <div class="badge">TEST GESLAAGD</div>
        <div class="divider"></div>
        <p style="margin: 8px 0; font-size: 13.5px; font-weight: 800;">
          Thermische printer gereed. BTW regimes actief:
        </p>
        <div style="font-size: 13px; font-weight: 800; margin: 8px 0; text-align: left;">
          <div class="flex-between" style="border-bottom: 1.5px solid #000; padding-bottom: 2px; margin-bottom: 4px;">
            <span>REGIME</span>
            <span>BTW TARIEF</span>
          </div>
          <div class="flex-between">
            <span>• Afhalen & Bezorging</span>
            <span>6% BTW</span>
          </div>
          <div class="flex-between">
            <span>• Ter Plaatse (Restaurant)</span>
            <span>12% BTW</span>
          </div>
        </div>
        <div class="divider"></div>
        <div style="font-size: 13px; font-weight: 800;">Datum: ${formatDateTime(new Date())}</div>
        <div style="font-size: 13px; font-weight: 800;">Formaat: 80mm Thermische Rol</div>
        <div class="divider-thick"></div>
        <div class="bold" style="font-size: 15px;">Pizza Town Online Systeem</div>
      </div>
      <div class="cut-space"></div>
    </body>
    </html>
  `;
};

/**
 * Trigger print using an invisible iframe to prevent main dashboard re-renders or page jumps
 */
export const printHtmlContent = (htmlContent) => {
  return new Promise((resolve) => {
    let iframe = document.getElementById('thermal-receipt-iframe');
    
    // Remove previous iframe if it exists
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'thermal-receipt-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Give browser time to parse CSS and fonts before triggering print dialog
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        resolve(true);
      } catch (err) {
        console.warn('Iframe print failed, falling back to popup window:', err);
        // Fallback for strict browser iframe sandbox policies
        const win = window.open('', '_blank', 'width=350,height=600');
        if (win) {
          win.document.open();
          win.document.write(htmlContent);
          win.document.close();
          win.focus();
          win.print();
          win.close();
        }
        resolve(true);
      }
    }, 250);
  });
};

/**
 * Print an order receipt
 */
export const printReceipt = async (order) => {
  if (!order) return false;
  const html = generateReceiptHtml(order);
  return await printHtmlContent(html);
};

/**
 * Print a test ticket
 */
export const printTestReceipt = async () => {
  const html = generateTestReceiptHtml();
  return await printHtmlContent(html);
};

export default {
  generateReceiptHtml,
  generateTestReceiptHtml,
  printReceipt,
  printTestReceipt
};
