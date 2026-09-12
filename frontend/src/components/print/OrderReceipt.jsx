import React from 'react';

const OrderReceipt = React.forwardRef(({ order }, ref) => {
  if (!order) return null;

  const subtotal = parseFloat(order.total_price) - parseFloat(order.delivery_fee);
  const isTakeaway = order.delivery_type?.toLowerCase() === 'takeaway';
  const customerAddress = order.delivery_address || order.users?.address || '';

  const dateStr = new Date(order.created_at).toLocaleString('nl-BE');
  const orderIdShort = order.order_id?.split('-')[0].toUpperCase();

  // Simple formatting helper
  const formatPrice = (price) => `€ ${parseFloat(price).toFixed(2)}`;

  return (
    <div ref={ref} className="print-receipt-container">
      {/* Styles strictly for print */}
      <style type="text/css" media="print">
        {`
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0;
            background: white;
          }
          .print-receipt-container {
            width: 80mm; /* Standard POS printer width */
            padding: 5mm;
            margin: 0;
            font-family: monospace, 'Courier New', Courier;
            color: black;
            font-size: 12px;
            line-height: 1.2;
          }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .divider { border-top: 1px dashed black; margin: 4px 0; }
          .divider-solid { border-top: 1px solid black; margin: 4px 0; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .flex-between { display: flex; justify-content: space-between; }
          .text-lg { font-size: 16px; }
          .text-xl { font-size: 18px; }
          .uppercase { text-transform: uppercase; }
        `}
      </style>
      
      {/* Container for local preview if rendered on screen, though usually hidden */}
      <div style={{ maxWidth: '80mm', fontFamily: 'monospace', color: '#000' }}>
        
        {/* Header */}
        <div className="text-center mb-2">
          <div className="font-bold text-lg">PIZZA TOWN</div>
          <div>Stationsstraat 14, 1861 Meise</div>
          <div>Tel: 02 269 71 76</div>
        </div>
        <div className="divider-solid" />

        {/* Delivery / Takeaway Banner */}
        <div className="text-center mb-2">
          <div className="font-bold text-lg uppercase">
            ** {isTakeaway ? 'AFHALEN' : 'BEZORGING'} **
          </div>
          <div className="font-bold">
            {isTakeaway 
              ? `AFHAALTIJD: ${order.pickup_time && order.pickup_time !== 'ASAP' ? order.pickup_time : 'ZO SNEL MOGELIJK'}` 
              : 'LEVERTIJD: CA. 45-60 MIN'}
          </div>
        </div>
        <div className="divider-solid" />

        {/* Order Details */}
        <div className="text-left mb-2">
          <div>Bestelling: #{orderIdShort}</div>
          <div>Datum: {dateStr}</div>
        </div>
        <div className="divider" />

        {/* Customer Details */}
        <div className="text-left mb-2">
          <div className="font-bold">Klant: {order.users?.full_name || 'Klant'}</div>
          {order.users?.phone_number && <div>Tel: {order.users?.phone_number}</div>}
          {customerAddress && customerAddress !== 'N/A' && <div>Adres: {customerAddress}</div>}
        </div>
        <div className="divider" />

        {/* Items Header */}
        <div className="flex-between font-bold mb-1">
          <span>Artikel</span>
          <span>Prijs</span>
        </div>
        <div className="divider" />

        {/* Items List */}
        <div className="mb-2">
          {order.items?.map((item, idx) => {
             const unitPrice = parseFloat(item.subtotal) / parseInt(item.quantity);
             const cust = item.customizations || {};
             
             return (
               <div key={idx} className="mb-1">
                 <div className="flex-between font-bold">
                   <span>{item.quantity}x {item.menuitems?.name || 'Onbekend'}</span>
                   <span>{formatPrice(item.subtotal)}</span>
                 </div>
                 
                 {/* Item customizations */}
                 {cust.size && <div style={{ paddingLeft: '8px' }}>- Formaat: {cust.size.id.toUpperCase()}</div>}
                 {cust.crust && <div style={{ paddingLeft: '8px' }}>- Bodem: {cust.crust.name}</div>}
                 {cust.toppings && cust.toppings.length > 0 && (
                   <div style={{ paddingLeft: '8px' }}>- Toppings: {cust.toppings.join(', ')}</div>
                 )}
                 
                 {/* Deal Subitems */}
                 {cust.subItems && Array.isArray(cust.subItems) && cust.subItems.map((sub, sidx) => (
                   <div key={sidx} style={{ paddingLeft: '8px' }}>
                     <div>- {sub.quantity || 1}x {sub.name}</div>
                     {sub.customizations?.size && <div style={{ paddingLeft: '16px' }}>&gt; Formaat: {sub.customizations.size.id.toUpperCase()}</div>}
                     {sub.customizations?.crust && <div style={{ paddingLeft: '16px' }}>&gt; Bodem: {sub.customizations.crust.name}</div>}
                     {sub.customizations?.toppings?.length > 0 && (
                       <div style={{ paddingLeft: '16px' }}>&gt; Toppings: {sub.customizations.toppings.join(', ')}</div>
                     )}
                   </div>
                 ))}
               </div>
             );
          })}
        </div>
        <div className="divider" />

        {/* Totals */}
        <div className="mb-2">
          <div className="flex-between">
            <span>Subtotaal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {parseFloat(order.delivery_fee) > 0 && (
            <div className="flex-between">
              <span>Bezorgkosten</span>
              <span>{formatPrice(order.delivery_fee)}</span>
            </div>
          )}
        </div>
        <div className="divider-solid" />
        
        <div className="flex-between font-bold text-lg mb-2">
          <span>TOTAAL</span>
          <span>{formatPrice(order.total_price)}</span>
        </div>
        <div className="divider-solid" />

        {/* Notes */}
        {order.delivery_notes && (
          <div className="mb-2">
            <div className="font-bold">OPMERKINGEN:</div>
            <div>{order.delivery_notes}</div>
            <div className="divider" />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-2">
          <div>Bedankt voor uw bestelling!</div>
          <div>Smakelijk eten!</div>
        </div>
        
        {/* Whitespace to allow paper feed out of printer */}
        <div style={{ height: '30mm' }}></div>

      </div>
    </div>
  );
});

export default OrderReceipt;
