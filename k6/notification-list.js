import http from 'k6/http';
import { check } from 'k6';

const VUS = parseInt(__ENV.VUS || '10');

export const options = {
  scenarios: {
    notification_list: {
      executor: 'per-vu-iterations',
      vus: VUS,
      iterations: 1,
      maxDuration: '3m',
    },
  },
  thresholds: {
    'http_req_duration{name:notification_list}': ['p(95)<800'],
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

  const res = http.get(`${BASE_URL}/api/notifications?size=20`, {
    ...authHeader,
    tags: { name: 'notification_list' },
  });

  const ok = check(res, { '알림 목록 조회 성공': (r) => r.status === 200 });

  if (!ok) {
    console.error(`VU ${__VU}: 실패 status=${res.status} body=${res.body}`);
  }
}
