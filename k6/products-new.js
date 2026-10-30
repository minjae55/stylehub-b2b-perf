import http from 'k6/http';
import { check, sleep } from 'k6';

// 메인 페이지에서 모든 사용자가 공통으로 호출하는 GET /api/products/new 부하 테스트.
const VUS = parseInt(__ENV.VUS || '500');
const MODE = __ENV.MODE || 'steady';

const SCENARIOS = {
  steady: { vus: VUS, duration: '30s' },
  burst: {
    scenarios: {
      burst: {
        executor: 'shared-iterations',
        vus: VUS,
        iterations: VUS,
        maxDuration: '60s',
      },
    },
  },
};

export const options = {
  ...SCENARIOS[MODE],
  thresholds: {
    'http_req_duration{name:products_new}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:8080';

// 토큰은 C:\tmp\make_tokens.ps1 로 미리 만들어 둔다 (유효기간 30분)
const TOKENS = JSON.parse(open('C:/tmp/tokens.json'));

export function setup() {
  return { tokens: TOKENS.slice(0, Math.min(VUS, 500)) };
}

export default function (data) {
  const accessToken = data.tokens[(__VU - 1) % data.tokens.length];

  const res = http.get(`${BASE_URL}/api/products/new`, {
    headers: { Cookie: `accessToken=${accessToken}` },
    tags: { name: 'products_new' },
  });

  check(res, {
    '신규 상품 조회 성공 (200)': (r) => r.status === 200,
  });

  if (MODE === 'steady') {
    sleep(1);
  }
}
