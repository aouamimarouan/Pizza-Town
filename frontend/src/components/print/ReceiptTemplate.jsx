import React from 'react';
import { Printer, X } from 'lucide-react';
import { printReceipt } from '../../utils/printService';

export const ReceiptTemplate = ({ order, onClose, showPrintButton = true }) => {
  if (!order) return null;

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
  
  let itemsSubtotal = 0;
  items.forEach((item) => {
    const qty = parseInt(item.quantity) || 1;
    if (item.subtotal) {
      itemsSubtotal += parseFloat(item.subtotal);
    } else if (item.price || item.menuitems?.price) {
      itemsSubtotal += parseFloat(item.price || item.menuitems?.price) * qty;
    }
  });

  const deliveryFee = parseFloat(order.delivery_fee || 0);
  const tvaAmount = itemsSubtotal * tvaRate;
  const totalPrice = itemsSubtotal + deliveryFee + tvaAmount;

  let badgeText = '★ BEZORGING ★';
  let timingText = 'LEVERTIJD: CA. 45-60 MIN • BTW 6%';
  if (isDineIn) {
    badgeText = '★ TER PLAATSE (RESTAURANT) ★';
    timingText = 'ETEN IN RESTAURANT • BTW 12%';
  } else if (isTakeaway) {
    badgeText = '★ AFHALEN ★';
    timingText = `AFHAALTIJD: ${order.pickup_time && order.pickup_time.toLowerCase() !== 'asap' ? order.pickup_time : 'ZO SNEL MOGELIJK'} • BTW 6%`;
  }

  const handlePrint = (e) => {
    if (e) e.stopPropagation();
    printReceipt(order);
  };

  return (
    <div className="bg-paper border border-slate/40 rounded-lg p-5 max-w-95 w-full font-mono text-ink shadow-md text-xs">
      {/* Action Header */}
      <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate/30">
        <span className="font-bold uppercase tracking-wider text-[11px] text-slate">Bon Voorbeeld</span>
        <div className="flex items-center gap-2">
          {showPrintButton && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 bg-ink text-paper hover:bg-signal-red rounded text-[11px] font-bold uppercase transition-colors"
              title="Afdrukken op thermische printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Afdrukken</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-mist rounded text-slate hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Simulated Thermal Paper */}
      <div className="bg-white text-black p-4 rounded border border-neutral-300 font-mono space-y-3">
        <div className="text-center space-y-0.5">
          <div className="font-black text-base tracking-wider">PIZZA TOWN</div>
          <div className="text-[10px] text-neutral-600">Stationsstraat 14, 1861 Meise</div>
          <div className="text-[10px] text-neutral-600">Tel: 02 269 71 76</div>
          <div className="my-2 border-t border-dashed border-neutral-400"></div>
          <div className="inline-block border-2 border-black px-2 py-0.5 font-black text-xs uppercase tracking-wide">
            {badgeText}
          </div>
          <div className="font-bold text-[11px] mt-1">
            {timingText}
          </div>
        </div>

        <div className="border-t border-dashed border-neutral-400"></div>

        <div className="flex justify-between text-[11px]">
          <span>Bestelling: <strong>#{orderShortId}</strong></span>
          <span>{new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className="text-[11px] space-y-0.5">
          <div>Klant: <strong>{customerName}</strong></div>
          {customerPhone && <div>Tel: <strong>{customerPhone}</strong></div>}
          {customerAddress && customerAddress !== 'N/A' && <div>Adres: <strong>{customerAddress}</strong></div>}
        </div>

        <div className="border-t-2 border-black"></div>
        <div className="flex justify-between font-bold text-[11px]">
          <span>ARTIKEL</span>
          <span>PRIJS</span>
        </div>
        <div className="border-t border-neutral-300"></div>

        {/* Items List */}
        <div className="space-y-2">
          {items.map((item, idx) => {
            const qty = parseInt(item.quantity) || 1;
            const name = item.menuitems?.name || item.name || 'Item';
            const price = item.subtotal 
              ? parseFloat(item.subtotal) 
              : parseFloat(item.price || item.menuitems?.price || 0) * qty;
            const cust = item.customizations || {};

            return (
              <div key={idx} className="text-[11px]">
                <div className="flex justify-between items-start">
                  <span className="font-bold flex-1 pr-2">{qty}x {name}</span>
                  <span className="font-bold whitespace-nowrap">€{price.toFixed(2)}</span>
                </div>
                {cust.size && (
                  <div className="text-[10px] text-neutral-600 pl-3">• Formaat: {cust.size.name || cust.size.id || cust.size}</div>
                )}
                {cust.crust && (
                  <div className="text-[10px] text-neutral-600 pl-3">• Bodem: {cust.crust.name || cust.crust}</div>
                )}
                {cust.toppings?.length > 0 && (
                  <div className="text-[10px] text-neutral-600 pl-3">• Toppings: {cust.toppings.join(', ')}</div>
                )}
                {cust.subItems?.map((sub, sIdx) => (
                  <div key={sIdx} className="text-[10px] pl-3 font-medium text-neutral-700">
                    - {sub.quantity > 1 ? `${sub.quantity}x ` : ''}{sub.name}
                  </div>
                ))}
                {cust.extras?.map((extra, eIdx) => (
                  <div key={eIdx} className="text-[10px] text-neutral-600 pl-3">+ {extra.name || extra}</div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="border-t border-dashed border-neutral-400"></div>

        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Subtotaal</span>
            <span>€{itemsSubtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>Bezorgkosten</span>
              <span>€{deliveryFee.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>BTW, {tvaPercentStr}</span>
            <span>€{tvaAmount.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="border-t-2 border-black"></div>
        <div className="flex justify-between font-black text-sm">
          <span>TOTAAL</span>
          <span>€{totalPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="border-t-2 border-black"></div>

        {notes && (
          <div className="border border-black p-2 bg-neutral-50 text-[10px]">
            <div className="font-bold">OPMERKINGEN:</div>
            <div>{notes}</div>
          </div>
        )}

        <div className="text-center text-[10px] text-neutral-500 pt-2 space-y-0.5">
          <div className="font-bold text-neutral-800">Bedankt voor uw bestelling!</div>
          <div>Smakelijk eten!</div>
          <div className="text-[9px] pt-1">*** Pizza Town Meise ***</div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
