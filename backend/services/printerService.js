import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

/**
 * Generates an ESC/POS receipt buffer and sends it to the PrintRelay server.
 * 
 * @param {Object} orderData - The formatted order data payload.
 * @returns {Promise<boolean>} - Success status.
 */
export const sendOrderToPrintRelay = async (orderData) => {
  try {
    // 1. Initialize Thermal Printer (Epson) without a specific interface
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      characterSet: 'PC858_EURO',
      removeSpecialCharacters: false,
      lineCharacter: '=',
    });

    // 2. Format Receipt Content
    printer.alignCenter();
    printer.bold(true);
    printer.println('PIZZA TOWN');
    printer.bold(false);
    printer.println('123 Rue de la Pizza, 1000 Bruxelles');
    printer.println('Tel: 02 123 45 67');
    printer.drawLine();

    // Order Type Header (Prominent)
    const isTakeaway = orderData.deliveryType?.toLowerCase() === 'takeaway';
    printer.alignCenter();
    printer.bold(true);
    printer.println(isTakeaway ? '** TAKEAWAY / SUR PLACE **' : '** LIVRAISON **');
    printer.bold(false);
    printer.drawLine();

    // Order Meta Data
    printer.alignLeft();
    printer.println(`Order ID: #${orderData.orderId.split('-')[0].toUpperCase()}`);
    printer.println(`Date: ${orderData.date}`);
    printer.drawLine();

    // Customer Info
    if (orderData.customer) {
      printer.println(`Client: ${orderData.customer.name}`);
      printer.println(`Tel: ${orderData.customer.phone}`);
      if (orderData.deliveryType === 'LIVRAISON' && orderData.customer.address) {
        printer.println(`Adresse: ${orderData.customer.address}`);
      }
    }
    printer.drawLine();

    // Items Loop (Directly from payload)
    printer.tableCustom([
      { text: 'Qte', align: 'LEFT', width: 0.1 },
      { text: 'Article', align: 'LEFT', width: 0.6 },
      { text: 'Price', align: 'RIGHT', width: 0.25 }
    ]);
    printer.drawLine();

    if (orderData.items && Array.isArray(orderData.items)) {
      orderData.items.forEach(item => {
        // Main Item Line
        const unitPrice = parseFloat(item.price);
        printer.tableCustom([
          { text: `${item.quantity}x`, align: 'LEFT', width: 0.1 },
          { text: item.name, align: 'LEFT', width: 0.6 },
          { text: `${(unitPrice * item.quantity).toFixed(2)} EUR`, align: 'RIGHT', width: 0.25 }
        ]);

        // Nested Items (subItems - e.g. for meal deals)
        if (item.subItems && Array.isArray(item.subItems)) {
          item.subItems.forEach(sub => {
            printer.println(`   - ${sub.quantity || 1}x ${sub.name}`);
            
            // Sub-item customizations (Pizza details in a Deal)
            const cust = sub.customizations;
            if (cust) {
              if (cust.size) printer.println(`     > Size: ${cust.size.id.toUpperCase()}`);
              if (cust.crust) printer.println(`     > Crust: ${cust.crust.name}`);
              if (cust.toppings && cust.toppings.length > 0) {
                printer.println(`     > Toppings: ${cust.toppings.join(', ')}`);
              }
            }
          });
        }

        // Modifiers (extras - e.g. extra cheese)
        if (item.extras && Array.isArray(item.extras)) {
          item.extras.forEach(extra => {
            printer.println(`      + ${extra.name}${extra.price ? ` (+${parseFloat(extra.price).toFixed(2)})` : ''}`);
          });
        }
      });
    }
    printer.drawLine();

    // Totals Section
    printer.tableCustom([
      { text: 'Subtotal', align: 'LEFT', width: 0.7 },
      { text: `${parseFloat(orderData.subtotal).toFixed(2)} EUR`, align: 'RIGHT', width: 0.3 }
    ]);
    
    if (parseFloat(orderData.deliveryFee) > 0) {
      printer.tableCustom([
        { text: 'Delivery Fee', align: 'LEFT', width: 0.7 },
        { text: `${parseFloat(orderData.deliveryFee).toFixed(2)} EUR`, align: 'RIGHT', width: 0.3 }
      ]);
    }
    printer.drawLine();
    
    printer.alignRight();
    printer.bold(true);
    printer.println(`TOTAL: ${parseFloat(orderData.total).toFixed(2)} EUR`);
    printer.bold(false);
    printer.drawLine();

    // Footer
    printer.alignCenter();
    printer.println('Merci de votre commande !');
    printer.println('Bon appetit !');
    printer.cut();
    
    // 3. Extract Buffer & Convert to Base64
    const buffer = await printer.getBuffer();
    const base64Data = buffer.toString('base64');
    
    // Clear buffer just in case
    printer.clear();

    // 4. Send to PrintRelay Server
    const serverUrl = process.env.PRINTRELAY_SERVER_URL;
    const apiKey = process.env.PRINTRELAY_API_KEY;
    const printerId = process.env.PRINTRELAY_PRINTER_ID;

    if (!serverUrl || !apiKey || !printerId) {
      console.warn("⚠️ PrintRelay credentials missing in .env. Skipping print job.");
      return false;
    }

    console.log(`[Printer] Sending job for Order #${orderData.orderId} to PrintRelay at ${serverUrl}...`);

    const response = await fetch(`${serverUrl}/printjobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64')
      },
      body: JSON.stringify({
        printerId: parseInt(printerId, 10),
        title: `Order #${orderData.orderId}`,
        contentType: 'raw_base64',
        content: base64Data,
        source: 'PizzaTown Backend'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PrintRelay API Error: ${response.status} - ${errorText}`);
    }

    console.log(`[Printer] ✅ PrintRelay Job Success!`);
    return true;

  } catch (error) {
    console.error(`[Printer Service] ❌ PrintRelay Error:`, error.message);
    throw error;
  }
};
