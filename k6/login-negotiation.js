import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    'http_req_duration{name:negotiation_list}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:8080';
const USER_COUNT = 600;

let accessToken = null;

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

  accessToken = res.cookies.accessToken[0].value;
}

export default function () {
  if (!accessToken) {
    login();
  }

  const negotiationRes = http.get(`${BASE_URL}/api/negotiations`, {
  headers: { Cookie: `accessToken=${accessToken}`},
    tags: { name: 'negotiation_list' },
  });

  const ok = check(negotiationRes, {
    '협상 목록 조회 성공 (200)': (r) => r.status === 200,
  });

  sleep(1);
}