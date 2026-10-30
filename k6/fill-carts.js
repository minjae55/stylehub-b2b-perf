import http from 'k6/http';
import { sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://43.201.75.57:8080';
const FROM = parseInt(__ENV.FROM || '0');
const TO = parseInt(__ENV.TO || '299');
const PASSWORD = JSON.parse(open('C:/tmp/login.json')).password;
const OPTIONS = JSON.parse(open(__ENV.OPTIONS_FILE || 'C:/tmp/ec2_options.json'));
const OFFSET = parseInt(__ENV.OFFSET || '0');

export const options = { vus: 1, iterations: 1 };

export default function () {
  const ok = [];
  let skipped = 0, noAddress = 0, failed = 0;

  for (let i = FROM; i <= TO; i++) {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: `user${i}@stylehub-test.com`, password: PASSWORD, rememberMe: false }),
      { headers: { 'Content-Type': 'application/json' } });
    if (loginRes.status !== 200) { failed++; continue; }

    const token = loginRes.cookies.accessToken[0].value;
    const auth = { headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${token}` } };

    const cart = http.get(`${BASE_URL}/api/carts`, auth).json('data');
    if (cart.length > 0) { skipped++; continue; }

    const addresses = http.get(`${BASE_URL}/api/addresses`, auth).json('data');
    if (addresses.length === 0) { noAddress++; continue; }

        const opt = OPTIONS[(i + OFFSET) % OPTIONS.length];
    const res = http.post(`${BASE_URL}/api/carts`,
      JSON.stringify({ productOptionId: opt.optionId, quantity: opt.quantity, cartType: 'NORMAL' }), auth);
    if (res.status === 200) ok.push(i); else failed++;
    sleep(0.05);
  }

  console.log(`filled=${ok.length} skipped=${skipped} noAddress=${noAddress} failed=${failed}`);
  console.log('FILLED_USERS=' + JSON.stringify(ok));
}