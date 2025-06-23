CREATE OR REPLACE FUNCTION get_next_order_number()
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    max_daily_seq_num BIGINT;
    today_order_count BIGINT;
BEGIN
    -- Check if there are any orders today
    SELECT COUNT(*)
    INTO today_order_count
    FROM trans_table
    WHERE trans_date = CURRENT_DATE;

    -- If no orders today, start from 1
    IF today_order_count = 0 THEN
        RETURN 1;
    END IF;

    -- Get the max order number for today
    SELECT COALESCE(MAX(order_number), 0)
    INTO max_daily_seq_num
    FROM trans_table
    WHERE 
        trans_date = CURRENT_DATE
        AND order_number > 0
        AND order_number < 1000000;

    RETURN max_daily_seq_num + 1;
END;
$$;
