DELIMITER $$

CREATE PROCEDURE inflate_negotiations(IN target_count BIGINT)
BEGIN
    DECLARE current_count BIGINT;
    SELECT COUNT(*) INTO current_count FROM negotiations;

    WHILE current_count < target_count DO
        INSERT INTO negotiations (
            negotiation_type, quote_id, contract_id, buyer_id, seller_id, admin_id,
            status, title, opened_at, agreed_at, closed_at, created_at, updated_at
        )
        SELECT
            negotiation_type, quote_id, contract_id, buyer_id, seller_id, admin_id,
            status, title, opened_at, agreed_at, closed_at, created_at, updated_at
        FROM negotiations;

        SELECT COUNT(*) INTO current_count FROM negotiations;
        SELECT current_count AS progress;
    END WHILE;
END$$

DELIMITER ;

CALL inflate_negotiations(10000000);
DROP PROCEDURE inflate_negotiations;

ANALYZE TABLE negotiations;
