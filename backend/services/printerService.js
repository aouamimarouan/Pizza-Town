import axios from 'axios';
import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';

/**
 * Generates a receipt buffer and sends it to PrintNode API.
 * 
 * @param {Object} orderData - The formatted order data payload.
 * @returns {Promise<Object>} - PrintNode API response.
 */
export const sendOrderToPrintNode = async (orderData) => {
  try {
    const printerId = process.env.PRINTNODE_PRINTER_ID;
    const apiKey = process.env.PRINTNODE_API_KEY;

    if (!printerId || !apiKey) {
      console.warn("⚠️ PrintNode configuration missing. Skipping print job.");
      return;
    }

    // 1. Initialize Thermal Printer (Epson)
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      // No interface needed for buffer generation
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

    // 4. Send to PrintNode API via Axios
    // Basic Auth Construction (API_KEY:)
    const authHeader = `Basic ${Buffer.from(apiKey + ':').toString('base64')}`;

    console.log(`[Printer] Sending print job for Order #${orderData.orderId} to PrintNode...`);

    const response = await axios.post(
      'https://api.printnode.com/printjobs',
      {
        printerId: parseInt(printerId),
        title: `Order #${orderData.orderId.split('-')[0].toUpperCase()}`,
        contentType: 'raw_base64',
        content: base64Data,
        source: 'Pizza Town Cloud Service'
      },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`[Printer] ✅ PrintNode Success! Job ID: ${response.data}`);
    return response.data;

  } catch (error) {
    console.error(`[Printer] ❌ PrintNode Error:`, error.response?.data || error.message);
    throw error;
  }
};
