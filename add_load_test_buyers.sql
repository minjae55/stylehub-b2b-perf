INSERT INTO users (email, password, name, phone, business_role, role, status, failed_login_attempts, company_id, created_at, updated_at)
SELECT
  CONCAT('loadtest', n, '@stylehub-test.com'),
  '$2a$10$7UAq2wPXvhm2kwKBytO2MuHCtFGP2Up12zkhxoFCpH3eWzwffjCnW',
  CONCAT('로드테스트유저', n),
  CONCAT('010-', LPAD(n, 4, '0'), '-0000'),
  'BUYER',
  'EMPLOYEE',
  'APPROVED',
  0,
  1057 + FLOOR(RAND() * 200),
  NOW(),
  NOW()
FROM (
  WITH RECURSIVE seq AS (
    SELECT 901 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 1000
  )
  SELECT n FROM seq
) t;
