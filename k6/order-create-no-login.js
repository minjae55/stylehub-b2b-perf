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

export function setup() {
  const tokens = [];
  for (let i = 1; i <= VUS; i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: `loadtest${i}@stylehub-test.com`, password: 'Password1234!', rememberMe: false }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    tokens.push(res.cookies.accessToken[0].value);
  }
  return { tokens };
}

export default function (data) {
  const accessToken = data.tokens[__VU - 1];
  const authHeader = { headers: { Cookie: `accessToken=${accessToken}` } };

  const cartRes = http.get(`${BASE_URL}/api/carts`, authHeader);
  const cartItems = cartRes.json('data').filter((item) => item.cartType === 'NORMAL');

  const addressRes = http.get(`${BASE_URL}/api/addresses`, authHeader);
  const addresses = addressRes.json('data');

  if (cartItems.length === 0 || addresses.length === 0) {
    console.error(`VU ${__VU}: 카트 또는 주소 없음`);
    return;
  }
Z
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