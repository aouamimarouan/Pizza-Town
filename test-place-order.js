async function placeOrder(token) {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [
          { menu_item_id: 'ce0b4710-b0ab-476c-b622-ec97159afe8d', quantity: 1 }
        ],
        delivery_type: 'delivery'
      })
    });
    const data = await response.json();
    if (response.ok) {
      console.log('Order placed successfully:', data.order_id);
    } else {
      console.error('Order placement failed:', data);
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

const token = process.argv[2];
if (!token) {
  console.error('Please provide a token.');
  process.exit(1);
}
placeOrder(token);
