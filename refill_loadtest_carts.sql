DROP PROCEDURE IF EXISTS refill_loadtest_carts;

DELIMITER $$

CREATE PROCEDURE refill_loadtest_carts(IN n INT)
BEGIN
    DELETE ci FROM cart_items ci
    JOIN users u ON ci.user_id = u.user_id
    WHERE u.email LIKE 'loadtest%@stylehub-test.com'
      AND CAST(SUBSTRING(u.email, 9, LOCATE('@', u.email) - 9) AS UNSIGNED) <= n;

    CREATE TEMPORARY TABLE tmp_buyers AS
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY RAND()) AS rn
    FROM users
    WHERE email LIKE 'loadtest%@stylehub-test.com'
      AND CAST(SUBSTRING(email, 9, LOCATE('@', email) - 9) AS UNSIGNED) <= n;

    CREATE TEMPORARY TABLE tmp_options AS
    SELECT po.product_option_id, p.moq, ROW_NUMBER() OVER (ORDER BY RAND()) AS rn
    FROM product_options po
    JOIN products p ON po.product_id = p.product_id
    WHERE po.stock_quantity >= 200
    LIMIT n;

    INSERT INTO cart_items (user_id, product_option_id, quantity, cart_type, is_checked, created_at, updated_at)
    SELECT b.user_id, o.product_option_id, o.moq, 'NORMAL', true, NOW(), NOW()
    FROM tmp_buyers b
    JOIN tmp_options o ON b.rn = o.rn;

    DROP TEMPORARY TABLE tmp_buyers;
    DROP TEMPORARY TABLE tmp_options;

    SELECT n AS refilled_count;
END$$

DELIMITER ;
