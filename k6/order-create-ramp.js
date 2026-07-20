import http from 'k6/http';
import { check } from 'k6';

const VUS = parseInt(__ENV.VUS || '10');

export const options = {
  scenarios: {
    order_create_ramp: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '3m',
    },
  },
  thresholds: {
    'http_req_duration{name:order_create}': ['p(95)<800'],
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  const email = `loadtest${__VU}@stylehub-test.com`;

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password: 'Password1234!', rememberMe: false }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { '로그인 성공': (r) => r.status === 200 });

  const accessToken = loginRes.cookies.accessToken[0].value;
  const authHeader = { headers: { Cookie: `accessToken=${accessToken}` } };

  const cartRes = http.get(`${BASE_URL}/api/carts`, authHeader);
  const cartItems = cartRes.json('data').filter((item) => item.cartType === 'NORMAL');

  const addressRes = http.get(`${BASE_URL}/api/addresses`, authHeader);
  const addresses = addressRes.json('data');

  if (cartItems.length === 0 || addresses.length === 0) {
    console.error(`${email}: 카트 또는 주소 없음`);
    return;
  }

  const orderRes = http.post(
    `${BASE_URL}/api/buyer/orders`,
    JSON.stringify({
      cartItemIds: cartItems.map((item) => item.cartItemId),
      addressId: addresses[0].addressId,
      cartType: 'NORMAL',
    }),
    {
      headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
      tags: { name: 'order_create' },
    }
  );

  check(orderRes, { '주문 생성 성공': (r) => r.status === 200 });
}