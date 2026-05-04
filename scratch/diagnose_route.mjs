
import http from 'http';

async function diagnoseRoute() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/customers',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-stress-test-secret': 'STRESS_INTEGRITY_2026'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log(`STATUS: ${res.statusCode}`);
      console.log(`CONTENT-TYPE: ${res.headers['content-type']}`);
      console.log(`BODY (first 100 chars): ${data.substring(0, 100)}`);
    });
  });
  
  req.on('error', (e) => console.error(e));
  req.write(JSON.stringify({ notes: "test" }));
  req.end();
}

diagnoseRoute();
