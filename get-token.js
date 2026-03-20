async function getToken() {
  try {
    const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test1@gmail.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    if (response.ok) {
      console.log(data.token);
    } else {
      console.error('Login failed:', data);
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

getToken();
