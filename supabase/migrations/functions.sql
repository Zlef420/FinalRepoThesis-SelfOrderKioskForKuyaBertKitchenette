'get_next_daily_order_number'

DECLARE
    max_daily_seq_num BIGINT;
    today_order_count BIGINT;
BEGIN
    -- First check if there are any orders today
    SELECT COUNT(*)
    INTO today_order_count
    FROM trans_table
    WHERE trans_date = CURRENT_DATE;
    
    -- If no orders today, return 1
    IF today_order_count = 0 THEN
        RETURN 1;
    END IF;

    -- Otherwise find the maximum order_number for today
    SELECT COALESCE(MAX(order_number), 0)
    INTO max_daily_seq_num
    FROM trans_table
    WHERE 
        trans_date = CURRENT_DATE
        AND order_number > 0
        AND order_number < 1000000;

    -- Return the next order number
    RETURN max_daily_seq_num + 1;
END;

'update_payment_on_success'


DECLARE
    v_trans_id BIGINT;
    ph_time timestamptz := now() at time zone 'Asia/Manila';
BEGIN
    -- First, update the payment_table and retrieve the transaction ID
    UPDATE public.payment_table
    SET 
        pymnt_status = 'Paid',
        pymnt_date = ph_time::date,
        pymnt_time = ph_time::time(0)
    WHERE pymnt_ref_id = p_payment_ref_id
    RETURNING fk_trans_id INTO v_trans_id;

    -- Then, if a transaction ID was found, update the trans_table as well
    IF v_trans_id IS NOT NULL THEN
        UPDATE public.trans_table
        SET pymnt_status = 'Paid'
        WHERE trans_id = v_trans_id;
    END IF;
END;
