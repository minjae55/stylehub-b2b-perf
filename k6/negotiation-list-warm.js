import http from 'k6/http';
import { check, sleep } from 'k6';

const VUS = parseInt(__ENV.VUS || '500');
const WARM = __ENV.WARM === '1';

export const options = {
  vus: VUS,
  duration: '30s',
  setupTimeout: '600s',
  thresholds: {
    'http_req_duration{name:negotiation_list}': ['p(95)<60000'],
    http_req_failed: ['rate<1'],
  },
};

const BASE_URL = 'http://localhost:8080';

export function setup() {
  const tokens = [];
  for (let i = 0; i < Math.min(VUS, 500); i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: `user${i}@stylehub-test.com`,
        password: 'Password1234!',
        rememberMe: false,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    tokens.push(res.cookies.accessToken[0].value);
  }

  // 측정 전에 사용자별 첫 페이지를 한 번씩 요청해 캐시를 채워 둠(측정 구간에는 포함되지 않음)
  if (WARM) {
    const BATCH = 50;
    for (let from = 0; from < tokens.length; from += BATCH) {
      const reqs = tokens.slice(from, from + BATCH).map((t) => [
        'GET',
        `${BASE_URL}/api/negotiations`,
        null,
        { headers: { Cookie: `accessToken=${t}` }, tags: { name: 'warmup' } },
      ]);
      http.batch(reqs);
    }
  }
  return { tokens };
}

export default function (data) {
  const accessToken = data.tokens[(__VU - 1) % data.tokens.length];

  const res = http.get(`${BASE_URL}/api/negotiations`, {
    headers: { Cookie: `accessToken=${accessToken}` },
    tags: { name: 'negotiation_list' },
  });

  check(res, { '협상 목록 조회 성공 (200)': (r) => r.status === 200 });
  sleep(1);
}
