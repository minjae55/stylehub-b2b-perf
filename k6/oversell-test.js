import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    oversell_test: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 1,
      maxDuration: '30s',
    },
  },
};

const BASE_URL = 'http://localhost:8080';
const TEST_OPTION_ID = 120001;

const EMAILS = [
  'user0@stylehub-test.com', 'user1@stylehub-test.com', 'user2@stylehub-test.com',
  'user6@stylehub-test.com', 'user7@stylehub-test.com', 'user8@stylehub-test.com',
  'user14@stylehub-test.com', 'user16@stylehub-test.com', 'user17@stylehub-test.com',
  'user22@stylehub-test.com', 'user24@stylehub-test.com', 'user26@stylehub-test.com',
  'user31@stylehub-test.com', 'user32@stylehub-test.com', 'user33@stylehub-test.com',
  'user34@stylehub-test.com', 'user35@stylehub-test.com', 'user37@stylehub-test.com',
  'user40@stylehub-test.com', 'user45@stylehub-test.com',
];

export default function () {
  const email = EMAILS[(__VU - 1) % EMAILS.length];

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password: 'Password1234!', rememberMe: false }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { '로그인 성공': (r) => r.status === 200 });

  const accessToken = loginRes.cookies.accessToken[0].value;
  const authHeader = { headers: { Cookie: `accessToken=${accessToken}` } };

  const cartRes = http.get(`${BASE_URL}/api/carts`, authHeader);
  const testItem = cartRes.json('data').find((item) => item.productOptionId === TEST_OPTION_ID);

  const addressRes = http.get(`${BASE_URL}/api/addresses`, authHeader);
  const addresses = addressRes.json('data');

  if (!testItem || addresses.length === 0) {
    console.error(`${email}: 테스트 장바구니 항목 또는 주소 없음`);
    return;
  }

  const orderRes = http.post(
    `${BASE_URL}/api/buyer/orders`,
    JSON.stringify({
      cartItemIds: [testItem.cartItemId],
      addressId: addresses[0].addressId,
      cartType: 'NORMAL',
    }),
    { headers: { 'Content-Type': 'application/json', Cookie: `accessToken=${accessToken}` } }
  );

  console.log(`${email}: 주문 결과 status=${orderRes.status}`);
}
