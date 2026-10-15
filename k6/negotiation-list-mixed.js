import http from 'k6/http';
import { check, sleep } from 'k6';

const VUS = parseInt(__ENV.VUS || '200');

export const options = {
  vus: VUS,
  duration: '30s',
//stages: [
//{ duration: '20s', target: VUS},
//{ duration: '30s', target: VUS},
//],
  setupTimeout: '300s',
  thresholds: {
    'http_req_duration{name:negotiation_list}': ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:8080';

const TOKENS = JSON.parse(open('C:/tmp/tokens.json'));

export function setup() {
  return { tokens: TOKENS.slice(0, Math.min(VUS, 500)) };
}

export default function (data) {
  const accessToken = data.tokens[(__VU - 1) % data.tokens.length];

 const page = Math.floor(Math.random() * 5);
  const negotiationRes = http.get(`${BASE_URL}/api/negotiations?page=${page}&size=20`, {
    headers: { Cookie: `accessToken=${accessToken}` },
    tags: { name: 'negotiation_list' },
  });

  check(negotiationRes, {
    '협상 목록 조회 성공 (200)': (r) => r.status === 200,
  });

  sleep(1);
}
