import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const VUS = parseInt(__ENV.VUS || '10');
const BLOCK = parseInt(__ENV.BLOCK || '30');
const PASSWORD = JSON.parse(open('C:/tmp/login.json')).password;

export const options = {
  vus: VUS,
  duration: '30s',
  thresholds: {
    'http_req_duration{name:order_create}': ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  if (__ITER >= BLOCK) { sleep(1); return; }
  const idx = (__VU - 1) * BLOCK + __ITER;

  const loginRes = http.post(`${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: `user${idx}@stylehub-test.com`, password: PASSWORD, rememberMe: false }),
    { headers: { 'Content-Type': 'application/json' } });
  const token = loginRes.cookies.accessToken[0].value;
  const auth = { headers: { Cookie: `accessToken=${token}` } };

  const cartItems = http.get(`${BASE_URL}/api/carts`, auth).json('data').filter((c) => c.cartType === 'NORMAL');
  const addresses = http.get(`${BASE_URL}/api/addresses`, auth).json('data');
  if (cartItems.length === 0 || addresses.length === 0) { sleep(1); return; }

  const orderRes = http.post(`${BASE_URL}/api/buyer/orders`,
    JSON.stringify({ cartItemIds: cartItems.map((c) => c.cartItemId), addressId: addresses[0].addressId, cartType: 'NORMAL' }),
    { headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${token}` }, tags: { name: 'order_create' } });

  check(orderRes, { '주문 생성 성공 (200)': (r) => r.status === 200 });
  sleep(1);
}