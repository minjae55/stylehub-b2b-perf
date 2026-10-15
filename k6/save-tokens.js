import http from 'k6/http';

// 부하 테스트용 토큰을 미리 만들어 C:\tmp\tokens.json에 저장하기 위한 스크립트.
// 실행: k6 run k6/save-tokens.js  (토큰 유효기간 30분)
export const options = { vus: 1, iterations: 1 };

const BASE_URL = 'http://localhost:8080';

export default function () {
  const tokens = [];
  for (let i = 0; i < 500; i++) {
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
  console.log('TOKENS_JSON=' + JSON.stringify(tokens));
}
