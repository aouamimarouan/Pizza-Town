import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import dotenv from 'dotenv';
dotenv.config();

// Simple Mutex for serializing print jobs
class PrintQueue {
  constructor() {
    this.queue = Promise.resolve();
  }
  add(job) {
    this.queue = this.queue.then(job).catch(err => console.error("Print job failed:", err));
    return this.queue;
  }
}
const printQueue = new PrintQueue();

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAWPRINT_EXE = path.join(__dirname, '../utils/rawprint.exe');

// Custom driver for node-thermal-printer when communicating with Windows spooler
const windowsSpoolerDriver = {
  getPrinter: (printerName) => ({
    name: printerName,
    status: 'READY'
  }),
  getPrinters: () => [{
    name: process.env.PRINTER_INTERFACE?.replace(/^printer:/, '') || 'printer WD8260',
    attributes: ['RAW-ONLY']
  }],
  printDirect: ({ data, printer, success, error }) => {
    try {
      const child = spawn(RAWPRINT_EXE, [printer], { windowsHide: true });
      child.stdin.write(data);
      child.stdin.end();

      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          if (success) success('job_' + Date.now());
        } else {
          const errMsg = `rawprint failed with exit code ${code}: ${stderr.trim()}`;
          console.error('[Printer Driver]', errMsg);
          if (error) error(new Error(errMsg));
        }
      });

      child.on('error', (err) => {
        console.error('[Printer Driver Process Error]:', err);
        if (error) error(err);
      });
    } catch (err) {
      console.error('[Printer Driver Execution Error]:', err);
      if (error) error(err);
    }
  }
};

// Format an item line with quantity, name, and right-aligned price without clipping
const formatItemLine = (qty, name, price, totalWidth = 42) => {
  const priceStr = `€ ${parseFloat(price).toFixed(2)}`;
  const qtyPrefix = `${qty}x `;
  const maxNameLen = totalWidth - qtyPrefix.length - priceStr.length - 1;

  if (name.length <= maxNameLen) {
    const spaces = Math.max(1, totalWidth - qtyPrefix.length - name.length - priceStr.length);
    return `${qtyPrefix}${name}${' '.repeat(spaces)}${priceStr}`;
  }

  let cutIdx = name.lastIndexOf(' ', maxNameLen);
  if (cutIdx <= 0) cutIdx = maxNameLen;

  const firstPart = name.substring(0, cutIdx).trim();
  const remainingPart = name.substring(cutIdx).trim();
  const spaces = Math.max(1, totalWidth - qtyPrefix.length - firstPart.length - priceStr.length);

  return `${qtyPrefix}${firstPart}${' '.repeat(spaces)}${priceStr}\n   ${remainingPart}`;
};

// Initialize printer helper with optional interface override
const getPrinter = (overrideInterface) => {
  const interfaceStr = overrideInterface || process.env.PRINTER_INTERFACE;
  if (!interfaceStr) {
    throw new Error("PRINTER_INTERFACE not configured in .env");
  }
  const width = parseInt(process.env.PRINTER_WIDTH, 10) || 42;

  const config = {
    type: PrinterTypes.EPSON,
    interface: interfaceStr,
    characterSet: CharacterSet.PC858_EURO,
    removeSpecialCharacters: false,
    lineCharacter: '=',
    width: width,
    options: {
      timeout: 3000
    }
  };

  if (interfaceStr.startsWith('printer:')) {
    config.driver = windowsSpoolerDriver;
  }

  return new ThermalPrinter(config);
};

// Gets active printer instance directly
const getActivePrinter = async () => {
  let printer = getPrinter();
  let isConnected = false;

  try {
    isConnected = await printer.isPrinterConnected();
  } catch (e) {
    isConnected = false;
  }

  return isConnected ? printer : null;
};

/**
 * Test connection to the printer
 */
export const testConnection = async () => {
  try {
    const printer = await getActivePrinter();
    if (!printer) {
      console.warn("[Printer] No printer available (Network & USB unreachable).");
      return false;
    }
    // Print a short test ticket in Dutch
    printer.alignCenter();
    printer.println("===============================");
    printer.println("PRINTERTEST GESLAAGD");
    printer.println("===============================");
    printer.newLine();
    printer.println("Systeem is klaar om bestellingen");
    printer.println("te printen.");
    printer.newLine();
    printer.newLine();
    printer.cut();
    await printer.execute();
    printer.clear();
    return true;
  } catch (error) {
    console.error("Test connection error:", error);
    return false;
  }
};

/**
 * Format order into standard data structure
 */
export const generatePrintPayload = (order) => {
  const subtotal = parseFloat(order.total_price.toString()) - parseFloat(order.delivery_fee.toString());
  const customerAddress = order.delivery_address || order.users?.address || '';

  return {
    orderId: order.order_id,
    date: order.created_at ? new Date(order.created_at).toLocaleString('nl-BE') : new Date().toLocaleString('nl-BE'),
    deliveryType: (order.delivery_type || 'takeaway').toUpperCase(),
    pickupTime: order.pickup_time || null,
    notes: order.delivery_notes || '',
    customer: {
      name: order.users?.full_name || 'Klant',
      phone: order.users?.phone_number || '', 
      address: customerAddress
    },
    items: (order.orderitems || []).map(item => {
      const cust = item.customizations || {};
      const extras = [...(cust.extras || [])];
      
      if (cust.toppings && Array.isArray(cust.toppings)) {
        cust.toppings.forEach(t => extras.push({ name: t }));
      }
      
      if (cust.crust) {
        extras.push({ name: `Bodem: ${cust.crust.name}` });
      }

      if (cust.size) {
        extras.push({ name: `Formaat: ${cust.size.id.toUpperCase()}` });
      }

      return {
        name: item.menuitems?.name || 'Onbekend Item',
        quantity: item.quantity,
        price: parseFloat(item.subtotal.toString()) / item.quantity,
        subItems: cust.subItems || [], 
        extras: extras
      };
    }),
    subtotal: subtotal,
    deliveryFee: parseFloat(order.delivery_fee.toString()),
    total: parseFloat(order.total_price.toString())
  };
};

/**
 * Print Customer Receipt (Klantbon in Dutch)
 */
export const printCustomerReceipt = async (orderData) => {
  return printQueue.add(async () => {
    try {
      const printer = await getActivePrinter();
      if (!printer) {
        console.warn(`[Printer] Offline. Cannot print customer receipt for Order #${orderData.orderId}`);
        return false;
      }

      printer.alignCenter();
      printer.bold(true);
      printer.println('PIZZA TOWN');
      printer.bold(false);
      printer.println('Stationsstraat 14, 1861 Meise');
      printer.println('Tel: 02 269 71 76');
      printer.drawLine();

      const isTakeaway = orderData.deliveryType?.toLowerCase() === 'takeaway';
      printer.alignCenter();
      printer.bold(true);
      printer.println(isTakeaway ? '** AFHALEN **' : '** BEZORGING **');
      if (isTakeaway) {
        printer.setTextDoubleHeight();
        if (orderData.pickupTime && orderData.pickupTime.toLowerCase() !== 'asap') {
          printer.println(`AFHAALTIJD: ${orderData.pickupTime}`);
        } else {
          printer.println('AFHAALTIJD: ZO SNEL MOGELIJK');
        }
        printer.setTextNormal();
      } else {
        printer.println('LEVERTIJD: CA. 45-60 MIN (MAX 1 UUR)');
      }
      printer.bold(false);
      printer.drawLine();

      printer.alignLeft();
      printer.println(`Bestelling: #${orderData.orderId.split('-')[0].toUpperCase()}`);
      printer.println(`Datum: ${orderData.date}`);
      printer.drawLine();

      if (orderData.customer) {
        printer.println(`Klant: ${orderData.customer.name}`);
        if (orderData.customer.phone) {
          printer.println(`Tel: ${orderData.customer.phone}`);
        }
        // Always display address if present (even on takeaway orders)
        if (orderData.customer.address && orderData.customer.address !== 'N/A') {
          printer.println(`Adres: ${orderData.customer.address}`);
        }
      }
      printer.drawLine();

      printer.leftRight('Artikel', 'Prijs');
      printer.drawLine();

      if (orderData.items && Array.isArray(orderData.items)) {
        const lineWidth = printer.getWidth() || 42;
        orderData.items.forEach(item => {
          const unitPrice = parseFloat(item.price);
          const line = formatItemLine(item.quantity, item.name, unitPrice * item.quantity, lineWidth);
          printer.println(line);

          if (item.subItems && Array.isArray(item.subItems)) {
            item.subItems.forEach(sub => {
              printer.println(`   - ${sub.quantity || 1}x ${sub.name}`);
              const cust = sub.customizations;
              if (cust) {
                if (cust.size) printer.println(`     > Formaat: ${cust.size.id.toUpperCase()}`);
                if (cust.crust) printer.println(`     > Bodem: ${cust.crust.name}`);
                if (cust.toppings && cust.toppings.length > 0) {
                  printer.println(`     > Toppings: ${cust.toppings.join(', ')}`);
                }
              }
            });
          }

          if (item.extras && Array.isArray(item.extras)) {
            item.extras.forEach(extra => {
              printer.println(`      + ${extra.name}${extra.price ? ` (+€ ${parseFloat(extra.price).toFixed(2)})` : ''}`);
            });
          }
        });
      }
      printer.drawLine();

      printer.leftRight('Subtotaal', `€ ${parseFloat(orderData.subtotal).toFixed(2)}`);
      
      if (parseFloat(orderData.deliveryFee) > 0) {
        printer.leftRight('Bezorgkosten', `€ ${parseFloat(orderData.deliveryFee).toFixed(2)}`);
      }
      printer.drawLine();
      
      printer.bold(true);
      printer.leftRight('TOTAAL', `€ ${parseFloat(orderData.total).toFixed(2)}`);
      printer.bold(false);
      printer.drawLine();

      if (orderData.notes) {
        printer.bold(true);
        printer.println("OPMERKINGEN:");
        printer.bold(false);
        printer.println(orderData.notes);
        printer.drawLine();
      }

      printer.alignCenter();
      printer.println('Bedankt voor uw bestelling!');
      printer.println('Smakelijk eten!');
      printer.newLine();
      printer.newLine();
      printer.cut();
      
      console.log(`[Printer] Executing customer receipt for Order #${orderData.orderId}...`);
      await printer.execute();
      printer.clear();
      return true;
    } catch (err) {
      console.error(`[Printer] Failed to print customer receipt:`, err.message);
      return false;
    }
  });
};

/**
 * Print Kitchen Ticket (Keukenbon & Bezorgerbon in Dutch)
 */
export const printKitchenTicket = async (orderData) => {
  return printQueue.add(async () => {
    try {
      const printer = await getActivePrinter();
      if (!printer) {
        console.warn(`[Printer] Offline. Cannot print kitchen ticket for Order #${orderData.orderId}`);
        return false;
      }

      printer.alignCenter();
      printer.setTextDoubleHeight();
      printer.setTextDoubleWidth();
      printer.println('** KEUKENBON **');
      printer.setTextNormal();
      printer.newLine();

      const isTakeaway = orderData.deliveryType?.toLowerCase() === 'takeaway';
      printer.bold(true);
      printer.println(isTakeaway ? 'AFHALEN / MEENEMEN' : 'BEZORGING');
      if (isTakeaway) {
        printer.setTextDoubleHeight();
        if (orderData.pickupTime && orderData.pickupTime.toLowerCase() !== 'asap') {
          printer.println(`AFHAALTIJD: ${orderData.pickupTime}`);
        } else {
          printer.println('AFHAALTIJD: ZO SNEL MOGELIJK');
        }
        printer.setTextNormal();
      } else {
        printer.println('LEVERTIJD: CA. 45-60 MIN (MAX 1 UUR)');
      }
      printer.bold(false);
      printer.drawLine();

      printer.alignLeft();
      printer.println(`Bestelling: #${orderData.orderId.split('-')[0].toUpperCase()}`);
      printer.println(`Tijd: ${orderData.date.split(' ')[1] || orderData.date}`);
      
      // Prominent customer and address information for kitchen & delivery driver
      if (orderData.customer) {
        printer.drawLine();
        printer.bold(true);
        printer.println(`Klant: ${orderData.customer.name}`);
        if (orderData.customer.phone) {
          printer.println(`Tel: ${orderData.customer.phone}`);
        }
        // Always print address so the delivery boy sees it clearly
        if (orderData.customer.address && orderData.customer.address !== 'N/A') {
          printer.println(`Adres: ${orderData.customer.address}`);
        }
        printer.bold(false);
      }
      printer.drawLine();

      if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
          printer.bold(true);
          printer.println(`${item.quantity}x ${item.name.toUpperCase()}`);
          printer.bold(false);

          if (item.subItems && Array.isArray(item.subItems)) {
            item.subItems.forEach(sub => {
              printer.println(`   - ${sub.quantity || 1}x ${sub.name}`);
              const cust = sub.customizations;
              if (cust) {
                if (cust.size) printer.println(`     [Formaat: ${cust.size.id.toUpperCase()}]`);
                if (cust.crust) printer.println(`     [Bodem: ${cust.crust.name}]`);
                if (cust.toppings && cust.toppings.length > 0) {
                  printer.println(`     [Toppings: ${cust.toppings.join(', ')}]`);
                }
              }
            });
          }

          if (item.extras && Array.isArray(item.extras)) {
            item.extras.forEach(extra => {
              printer.println(`      + ${extra.name}`);
            });
          }
          printer.newLine();
        });
      }
      
      if (orderData.notes) {
        printer.drawLine();
        printer.bold(true);
        printer.println("OPMERKINGEN:");
        printer.bold(false);
        printer.println(orderData.notes);
      }

      printer.newLine();
      printer.newLine();
      printer.cut();
      
      console.log(`[Printer] Executing kitchen ticket for Order #${orderData.orderId}...`);
      await printer.execute();
      printer.clear();
      return true;
    } catch (err) {
      console.error(`[Printer] Failed to print kitchen ticket:`, err.message);
      return false;
    }
  });
};
