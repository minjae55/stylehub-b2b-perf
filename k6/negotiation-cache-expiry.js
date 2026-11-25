// 협의 목록 캐시 동시 만료 재현
// 1) setup에서 사용자 VUS명의 첫 페이지 캐시를 같은 순간에 채운다 (배포 직후·트래픽 몰림 상황 가정)
// 2) 본 측정은 각 사용자가 첫 페이지만 1초 간격으로 계속 조회한다 (실제 사용 패턴)
// 3) TTL이 고정이면 채운 지 TTL초 뒤에 키가 한꺼번에 만료되어 DB 조회가 몰린다
import http from 'k6/http';
import { check, sleep } from 'k6';

const VUS = parseInt(__ENV.VUS || '500');
const BASE_URL = 'http://localhost:8080';

export const options = {
  vus: VUS,
  duration: __ENV.DURATION || '150s',
  setupTimeout: '600s',
  thresholds: {
    'http_req_duration{name:negotiation_list}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  const tokens = [];
  for (let i = 0; i < Math.min(VUS, 500); i++) {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({ email: `user${i}@stylehub-test.com`, password: 'Password1234!', rememberMe: false }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    tokens.push(res.cookies.accessToken[0].value);
  }

  // 모든 사용자의 첫 페이지 캐시를 같은 순간에 채움 (측정 구간에는 포함되지 않음)
  const BATCH = 50;
  for (let from = 0; from < tokens.length; from += BATCH) {
    http.batch(tokens.slice(from, from + BATCH).map((t) => [
      'GET', `${BASE_URL}/api/negotiations`, null,
      { headers: { Cookie: `accessToken=${t}` }, tags: { name: 'warmup' } },
    ]));
  }
  console.log(`WARM_DONE ${Date.now()}`);
  return { tokens };
}

export default function (data) {
  const token = data.tokens[(__VU - 1) % data.tokens.length];
  const res = http.get(`${BASE_URL}/api/negotiations`, {
    headers: { Cookie: `accessToken=${token}` },
    tags: { name: 'negotiation_list' },
  });
  check(res, { '협의 목록 조회 성공 (200)': (r) => r.status === 200 });
  sleep(1);
}
