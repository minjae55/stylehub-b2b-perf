import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration{name:order_create}': ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:8080';
const USER_COUNT = 600;

function login() {
  const userIndex = Math.floor(Math.random() * USER_COUNT);
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: `user${userIndex}@stylehub-test.com`,
      password: 'Password1234!',
      rememberMe: false,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res, { '로그인 성공 (200)': (r) => r.status === 200 });
  return res.cookies.accessToken[0].value;
}

export default function () {
  const accessToken = login();
  const authHeader = { headers: { Cookie: `accessToken=${accessToken}` } };

  const cartRes = http.get(`${BASE_URL}/api/carts`, authHeader);
  check(cartRes, { '장바구니 조회 성공 (200)': (r) => r.status === 200 });

  const addressRes = http.get(`${BASE_URL}/api/addresses`, authHeader);
  check(addressRes, { '주소 조회 성공 (200)': (r) => r.status === 200 });

  const cartItems = cartRes.json('data').filter((item) => item.cartType === 'NORMAL');
  const addresses = addressRes.json('data');

  if (cartItems.length === 0 || addresses.length === 0) {
    sleep(1);
    return;
  }

  const cartItemIds = cartItems.map((item) => item.cartItemId);
  const addressId = addresses[0].addressId;

  const orderRes = http.post(
    `${BASE_URL}/api/buyer/orders`,
    JSON.stringify({
      cartItemIds: cartItemIds,
      addressId: addressId,
      cartType: 'NORMAL',
    }),
    {
      headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` },
      tags: { name: 'order_create' },
    }
  );

  const ok = check(orderRes, {
    '주문 생성 성공 (200)': (r) => r.status === 200,
  });

  if (!ok) {
    console.error(`실패: status=${orderRes.status} body=${orderRes.body}`);
  }

  sleep(1);
}