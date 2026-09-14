/**
 * Browser-based POS Thermal Receipt Printing Service for Pizza Town
 * Formatted specifically for 80mm thermal receipt paper (Epson TM-m30II)
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
  }
  body {
    font-family: 'Courier New', Courier, 'Lucida Console', Monaco, monospace;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.35;
    color: #000;
    background: #fff;
    width: 80mm;
    max-width: 80mm;
    margin: 0 auto;
    padding: 4mm 4mm 22mm 4mm; /* Extra bottom padding ensures the physical blade does not cut through text */
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
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
    font-weight: 900;
  }
  .title {
    font-size: 19px;
    font-weight: 900;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }
  .subtitle {
    font-size: 11px;
    color: #333;
    margin-bottom: 4px;
  }
  .badge {
    display: inline-block;
    border: 2px solid #000;
    padding: 3px 8px;
    font-size: 15px;
    font-weight: 900;
    margin: 6px 0;
    text-transform: uppercase;
  }
  .divider {
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .divider-double {
    border-top: 2px solid #000;
    margin: 6px 0;
  }
  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .flex-between span:first-child {
    flex: 1;
    padding-right: 6px;
    word-break: break-word;
  }
  .flex-between span:last-child {
    white-space: nowrap;
    text-align: right;
  }
  .order-meta {
    font-size: 12px;
    margin-bottom: 4px;
  }
  .customer-box {
    margin: 6px 0;
    font-size: 12px;
  }
  .item-row {
    margin: 5px 0;
  }
  .item-name {
    font-weight: 700;
    font-size: 13px;
  }
  .item-customizations {
    padding-left: 14px;
    font-size: 11px;
    color: #222;
  }
  .subitem {
    font-weight: 600;
    margin-top: 2px;
  }
  .total-row {
    font-size: 16px;
    font-weight: 900;
    margin-top: 4px;
  }
  .notes-box {
    border: 1px solid #000;
    padding: 4px;
    margin: 6px 0;
    font-size: 12px;
    background: #f9f9f9;
  }
  .footer {
    text-align: center;
    font-size: 11px;
    margin-top: 10px;
  }
  .cut-space {
    height: 18mm;
  }
`;

/**
 * Generate HTML string for an order
 */
export const generateReceiptHtml = (order) => {
  const items = order.items || order.orderitems || [];
  const isTakeaway = (order.delivery_type || '').toLowerCase() === 'takeaway';
  const customerName = order.users?.full_name || order.customer_name || 'Klant';
  const customerPhone = order.users?.phone_number || order.phone || '';
  const customerAddress = order.delivery_address || order.users?.address || '';
  const orderShortId = (order.order_id || '').split('-')[0].toUpperCase();
  const notes = order.delivery_notes || order.notes || '';
  
  const totalPrice = parseFloat(order.total_price || 0);
  const deliveryFee = parseFloat(order.delivery_fee || 0);
  const subtotal = Math.max(0, totalPrice - deliveryFee);

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
      detailsHtml += `<div>• Toppings: ${cust.toppings.join(', ')}</div>`;
    }
    // Deal sub items
    if (cust.subItems && Array.isArray(cust.subItems)) {
      cust.subItems.forEach((sub) => {
        detailsHtml += `<div class="subitem">  - ${sub.quantity > 1 ? `${sub.quantity}x ` : ''}${sub.name}</div>`;
        if (sub.customizations) {
          if (sub.customizations.size) {
            detailsHtml += `<div style="padding-left: 10px;">> Formaat: ${sub.customizations.size.name || sub.customizations.size.id}</div>`;
          }
          if (sub.customizations.crust) {
            detailsHtml += `<div style="padding-left: 10px;">> Bodem: ${sub.customizations.crust.name || sub.customizations.crust}</div>`;
          }
          if (sub.customizations.toppings?.length) {
            detailsHtml += `<div style="padding-left: 10px;">> Toppings: ${sub.customizations.toppings.join(', ')}</div>`;
          }
        }
      });
    }
    // Extras
    if (cust.extras && Array.isArray(cust.extras)) {
      cust.extras.forEach((extra) => {
        detailsHtml += `<div>+ ${extra.name || extra}</div>`;
      });
    }

    itemsHtml += `
      <div class="item-row">
        <div class="flex-between">
          <span class="item-name">${qty}x ${itemName}</span>
          <span class="bold">${formatPrice(itemTotal)}</span>
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
        <div class="badge">${isTakeaway ? '★ AFHALEN ★' : '★ BEZORGING ★'}</div>
        <div class="bold" style="font-size: 13px; margin-top: 2px;">
          ${isTakeaway 
            ? `AFHAALTIJD: ${order.pickup_time && order.pickup_time.toLowerCase() !== 'asap' ? order.pickup_time : 'ZO SNEL MOGELIJK'}`
            : 'LEVERTIJD: CA. 45-60 MIN'}
        </div>
      </div>

      <div class="divider"></div>

      <div class="order-meta">
        <div class="flex-between">
          <span>Bestelling: <strong>#${orderShortId}</strong></span>
          <span>${formatDateTime(order.created_at)}</span>
        </div>
      </div>

      <div class="customer-box">
        <div>Klant: <strong>${customerName}</strong></div>
        ${customerPhone ? `<div>Tel: <strong>${customerPhone}</strong></div>` : ''}
        ${customerAddress && customerAddress !== 'N/A' ? `<div>Adres: <strong>${customerAddress}</strong></div>` : ''}
      </div>

      <div class="divider-double"></div>
      <div class="flex-between bold" style="font-size: 12px; margin-bottom: 4px;">
        <span>ARTIKEL</span>
        <span>PRIJS</span>
      </div>
      <div class="divider"></div>

      ${itemsHtml || '<div class="center">Geen artikelen</div>'}

      <div class="divider"></div>

      <div class="flex-between">
        <span>Subtotaal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>

      ${deliveryFee > 0 ? `
        <div class="flex-between">
          <span>Bezorgkosten</span>
          <span>${formatPrice(deliveryFee)}</span>
        </div>
      ` : ''}

      <div class="divider-double"></div>

      <div class="flex-between total-row">
        <span>TOTAAL</span>
        <span>${formatPrice(totalPrice)}</span>
      </div>

      <div class="divider-double"></div>

      ${notes ? `
        <div class="notes-box">
          <div class="bold" style="margin-bottom: 2px;">OPMERKINGEN:</div>
          <div>${notes}</div>
        </div>
      ` : ''}

      <div class="footer">
        <div class="bold">Bedankt voor uw bestelling!</div>
        <div>Smakelijk eten!</div>
        <div style="font-size: 9px; margin-top: 6px; color: #666;">*** Pizza Town Meise ***</div>
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
        <div class="divider-double"></div>
        <div class="badge">TEST GESLAAGD</div>
        <div class="divider"></div>
        <p style="margin: 8px 0;">De thermische printer is correct gekoppeld en klaar om bestellingen te ontvangen.</p>
        <div class="divider"></div>
        <div style="font-size: 11px;">Datum: ${formatDateTime(new Date())}</div>
        <div style="font-size: 11px;">Breedte: 80mm (Standaard POS)</div>
        <div class="divider-double"></div>
        <div class="bold">Pizza Town Online Systeem</div>
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
