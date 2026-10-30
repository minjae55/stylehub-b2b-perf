-- 0단계: 이전 시도에서 남은 임시 테이블 정리 (재실행 안전장치)
DROP TEMPORARY TABLE IF EXISTS company_map;
DROP TEMPORARY TABLE IF EXISTS company_ordered;
DROP TEMPORARY TABLE IF EXISTS buyer_ordered;

-- 1단계: 회사별 대표 브랜드/판매자 매핑
CREATE TEMPORARY TABLE company_map AS
SELECT
  c.company_id,
  (SELECT MIN(b.brand_id) FROM brands b WHERE b.company_id = c.company_id) AS brand_id,
  (SELECT MIN(u.user_id) FROM users u WHERE u.company_id = c.company_id AND u.business_role IN ('SELLER','BOTH')) AS seller_id
FROM companies c;

CREATE TEMPORARY TABLE company_ordered AS
SELECT company_id, brand_id, seller_id, (@row_number:=@row_number+1) - 1 AS rn
FROM company_map, (SELECT @row_number:=0) r
WHERE brand_id IS NOT NULL AND seller_id IS NOT NULL;

SET @valid_company_count = (SELECT COUNT(*) FROM company_ordered);

-- 2단계: 상품 99만 건 추가 (이미 완료됨 - products 1,000,001건 확인. 아래 블록 통째로 주석 처리)
/*
INSERT INTO products
  (product_name, moq, unit_price, lead_time_days, main_material,
   description, sample_available, is_active, oem_available, white_label,
   brand_id, category_id, company_id, seller_id, created_at, updated_at)
SELECT
  CONCAT('부하테스트상품-', t.n),
  10 + FLOOR(RAND()*190),
  5000 + FLOOR(RAND()*95000),
  1 + FLOOR(RAND()*13),
  '면 100%',
  '부하테스트용 시드 데이터',
  1, 1, 0, 0,
  co.brand_id,
  (SELECT category_id FROM categories ORDER BY RAND() LIMIT 1),
  co.company_id,
  co.seller_id,
  NOW(), NOW()
FROM (
  SELECT (a.N + b.N*10 + c.N*100 + d.N*1000 + e.N*10000 + f.N*100000) AS n
  FROM
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) d,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) e,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) f
  WHERE (a.N + b.N*10 + c.N*100 + d.N*1000 + e.N*10000 + f.N*100000) < 990000
) t
JOIN company_ordered co ON co.rn = t.n % @valid_company_count
WHERE NOT EXISTS (
  SELECT 1 FROM products p2 WHERE p2.product_name = CONCAT('부하테스트상품-', t.n)
);
*/

-- 3단계: 옵션 - 새로 추가된 상품마다 3개씩
INSERT INTO product_options
  (option_label, sku, stock_quantity, additional_price, is_active, product_id, created_at, updated_at)
SELECT
  CONCAT('옵션', opt.n + 1),
  CONCAT('SKU-', p.product_id, '-', opt.n + 1),
  FLOOR(RAND() * 1000),
  0, 1, p.product_id, NOW(), NOW()
FROM products p
JOIN (SELECT 0 n UNION SELECT 1 UNION SELECT 2) opt
WHERE p.product_id > 10001
  AND NOT EXISTS (SELECT 1 FROM product_options po WHERE po.product_id = p.product_id);

-- 4단계: 구매자 회전용 매핑
CREATE TEMPORARY TABLE buyer_ordered AS
SELECT user_id, (@rn2 := @rn2 + 1) - 1 AS rn
FROM users, (SELECT @rn2 := 0) r
WHERE business_role IN ('BUYER', 'BOTH');

SET @valid_buyer_count = (SELECT COUNT(*) FROM buyer_ordered);

-- 5단계: 주문 98만 건 추가
INSERT INTO orders
  (order_no, buyer_id, seller_company_id, seller_company_name, order_type, status,
   subtotal_amount, platform_fee, shipping_fee, total_amount, is_sample,
   receiver_name, receiver_phone, receiver_address, created_at, updated_at)
SELECT
  CONCAT('ORD-LOAD-', LPAD(t.n, 7, '0')),
  bu.user_id,
  co.company_id,
  (SELECT name FROM companies WHERE company_id = co.company_id),
  'NORMAL',
  ELT(1 + FLOOR(RAND() * 5), 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED'),
  500000, 15000, 3000, 518000, 0,
  '부하테스트수령인', '01000000000', '서울시 테스트구 테스트로 123',
  NOW(), NOW()
FROM (
  SELECT (a.N + b.N*10 + c.N*100 + d.N*1000 + e.N*10000 + f.N*100000) AS n
  FROM (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
       (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
       (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c,
       (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) d,
       (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) e,
       (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) f
  WHERE (a.N + b.N*10 + c.N*100 + d.N*1000 + e.N*10000 + f.N*100000) < 980000
) t
JOIN company_ordered co ON co.rn = t.n % @valid_company_count
JOIN buyer_ordered bu ON bu.rn = t.n % @valid_buyer_count
WHERE NOT EXISTS (
  SELECT 1 FROM orders o2 WHERE o2.order_no = CONCAT('ORD-LOAD-', LPAD(t.n, 7, '0'))
);
