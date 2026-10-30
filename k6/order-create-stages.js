import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const STAGES = (__ENV.STAGES || '100,300,500').split(',').map(Number);
const DURATION = __ENV.DURATION || '30s';
const GAP_SEC = parseInt(__ENV.GAP || '40');
const USERS = parseInt(__ENV.USERS || '600');
const PASSWORD = JSON.parse(open('C:/tmp/login.json')).password;
const OPTIONS = JSON.parse(open(__ENV.OPTIONS_FILE || 'C:/tmp/small_options.json'));

const stageSec = parseInt(DURATION) + GAP_SEC;
const scenarios = {};
const thresholds = {};
STAGES.forEach((vus, i) => {
  const name = `vu${vus}`;
  scenarios[name] = {
    executor: 'constant-vus',
    vus,
    duration: DURATION,
    startTime: `${i * stageSec}s`,
    gracefulStop: '30s',
  };
  thresholds[`http_req_duration{name:order_create,scenario:${name}}`] = ['p(95)<600000'];
  thresholds[`http_req_failed{name:order_create,scenario:${name}}`] = ['rate<1'];
});

export const options = { scenarios, thresholds, setupTimeout: '10m' };

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const LOGIN_ONCE = __ENV.LOGIN_ONCE === '1';
let addressId = null;
let auth = null;

export function setup() {
  if (!LOGIN_ONCE) return { users: [] };
  const users = [];
  const BATCH = 20;
  for (let from = 0; from < USERS; from += BATCH) {
    const reqs = [];
    for (let i = from; i < Math.min(from + BATCH, USERS); i++) {
      reqs.push(['POST', `${BASE_URL}/api/auth/login`,
        JSON.stringify({ email: `user${i}@stylehub-test.com`, password: PASSWORD, rememberMe: false }),
        { headers: JSON_HEADERS, tags: { name: 'setup_login' } }]);
    }
    const res = http.batch(reqs);
    res.forEach((r) => {
      if (r.status !== 200) { users.push(null); return; }
      const h = { headers: { ...JSON_HEADERS, Cookie: `accessToken=${r.cookies.accessToken[0].value}` } };
      const a = http.get(`${BASE_URL}/api/addresses`, { ...h, tags: { name: 'setup_addresses' } }).json('data');
      users.push(a && a.length > 0 ? { token: r.cookies.accessToken[0].value, addressId: a[0].addressId } : null);
    });
  }
  return { users };
}

export default function (data) {
  const idx = (__VU - 1) % USERS;
  const opt = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];

  if (LOGIN_ONCE) {
    const pre = data.users[idx];
    if (!pre) { sleep(1); return; }
    auth = { headers: { ...JSON_HEADERS, Cookie: `accessToken=${pre.token}` } };
    addressId = pre.addressId;
  } else {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: `user${idx}@stylehub-test.com`, password: PASSWORD, rememberMe: false }),
      { headers: JSON_HEADERS, tags: { name: 'login' } });
    if (loginRes.status !== 200) { sleep(1); return; }
    const token = loginRes.cookies.accessToken[0].value;
    auth = { headers: { ...JSON_HEADERS, Cookie: `accessToken=${token}` } };

    if (addressId === null) {
      const addresses = http.get(`${BASE_URL}/api/addresses`, { ...auth, tags: { name: 'addresses' } }).json('data');
      if (!addresses || addresses.length === 0) { sleep(1); return; }
      addressId = addresses[0].addressId;
    }
  }

  http.post(`${BASE_URL}/api/carts`,
    JSON.stringify({ productOptionId: opt.optionId, quantity: opt.quantity, cartType: 'NORMAL' }),
    { ...auth, tags: { name: 'cart_add' } });
  const cart = http.get(`${BASE_URL}/api/carts`, { ...auth, tags: { name: 'cart_get' } }).json('data');
  const item = cart.find((c) => c.productOptionId === opt.optionId && c.cartType === 'NORMAL');
  if (!item) { sleep(1); return; }

  const orderRes = http.post(`${BASE_URL}/api/buyer/orders`,
    JSON.stringify({ cartItemIds: [item.cartItemId], addressId, cartType: 'NORMAL' }),
    { ...auth, tags: { name: 'order_create' } });
  const ok = check(orderRes, { '주문 생성 성공 (200)': (r) => r.status === 200 });
  if (!ok && __ENV.DEBUG) console.log(`order fail ${orderRes.status} ${orderRes.body.substring(0, 200)}`);
  sleep(1);
}
