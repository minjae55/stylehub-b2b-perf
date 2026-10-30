import http from 'k6/http';
import { sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://43.201.75.57:8080';
const FROM = parseInt(__ENV.FROM || '9000');
const TO = parseInt(__ENV.TO || '10000');

const LOGIN = JSON.parse(open('C:/tmp/login.json'));

export const options = { vus: 1, iterations: 1 };

export default function () {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(LOGIN), {
    headers: { 'Content-Type': 'application/json' },
  });

  const token = loginRes.cookies.accessToken[0].value;
  const auth = { headers: { Cookie: `accessToken=${token}` } };

  const found = [];
  for (let id = FROM; id <= TO; id++) {
    const res = http.get(`${BASE_URL}/api/products/${id}`, auth);
    if (res.status !== 200) continue;

    const p = res.json('data');
    if (!p.isActive) continue;

    for (const o of p.options) {
      if (o.isActive && o.stockQuantity >= p.moq) {
        found.push({ optionId: o.productOptionId, quantity: p.moq, stock: o.stockQuantity });
      }
    }
    sleep(0.05);
  }

  // 결과를 로그로 출력 (k6의 console.log는 stderr로 나옴)
  console.log('OPTIONS_JSON=' + JSON.stringify(found));
  console.log('count=' + found.length);
}