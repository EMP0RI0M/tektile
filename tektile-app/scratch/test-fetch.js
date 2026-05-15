
const url = 'https://srmnslrgwtaonmljtkno.supabase.co/auth/v1/health';
fetch(url)
  .then(res => {
    console.log('Status:', res.status);
    return res.json();
  })
  .then(data => console.log('Data:', data))
  .catch(err => {
    console.error('Fetch Error:', err);
    if (err.cause) console.error('Cause:', err.cause);
  });
