DELIMITER $$

CREATE PROCEDURE build_quote_chain(IN chain_label VARCHAR(10), IN depth INT)
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE parent_id INT DEFAULT NULL;

    WHILE i <= depth DO
        INSERT INTO quotes (
            quote_no, sourcing_id, buyer_id, seller_id, company_id,
            company_name, buyer_name, seller_name, brand_name,
            parent_quote_id, version,
            product_name, category_name, material, lead_time_days,
            delivery_company, shipping_fee, valid_until, sample_available,
            subtotal_amount, total_amount, status,
            created_at, submitted_at
        ) VALUES (
            CONCAT('CHAIN-', chain_label, '-V', i), 16263, 3720, 3594, 1204,
            '체인테스트', '체인바이어', '체인셀러', NULL,
            parent_id, i,
            '체인 테스트 상품', NULL, 'Leather', 4,
            NULL, 3000, DATE_ADD(NOW(), INTERVAL 30 DAY), 'AVAILABLE',
            500000, 503000, 'SUBMITTED',
            NOW(), NOW()
        );

        SET parent_id = LAST_INSERT_ID();
        SET i = i + 1;
    END WHILE;

    SELECT chain_label, depth, parent_id AS leaf_quote_id;
END$$

DELIMITER ;

CALL build_quote_chain('D1', 1);
CALL build_quote_chain('D5', 5);
CALL build_quote_chain('D10', 10);
CALL build_quote_chain('D20', 20);
CALL build_quote_chain('D50', 50);

DROP PROCEDURE build_quote_chain;
