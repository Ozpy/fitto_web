async function run() {
  const url = 'https://asistencia.innavanti.com/webhook/fitto-generate-plan';
  const secret = 'miclave';
  const userId = 'd5d9c228-7ae8-4ad1-924a-b38afd1aa952';

  console.log('Sending request to n8n...');
  console.log('URL:', url);
  console.log('Header ftt_value:', secret);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ftt_value': secret
      },
      body: JSON.stringify({
        user_id: userId,
        compare: false
      })
    });

    console.log('Response Status:', res.status);
    console.log('Response OK:', res.ok);
    const text = await res.text();
    console.log('Response Body:', text);
  } catch (err) {
    console.error('Error during fetch:', err);
  }
}

run();
