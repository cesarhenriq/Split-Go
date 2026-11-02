CREATE OR REPLACE FUNCTION validate_expense_split_integrity(p_expense_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_amount bigint;
  v_split_method expense_split_method;
  v_split_count bigint;
  v_share_total bigint;
  v_percentage_total numeric;
  v_missing_percentage bigint;
BEGIN
  SELECT total_amount, split_method
  INTO v_total_amount, v_split_method
  FROM expenses
  WHERE id = p_expense_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  SELECT
    count(*),
    coalesce(sum(share_amount), 0),
    coalesce(sum(percentage), 0),
    count(*) FILTER (WHERE percentage IS NULL)
  INTO
    v_split_count,
    v_share_total,
    v_percentage_total,
    v_missing_percentage
  FROM expense_splits
  WHERE expense_id = p_expense_id;

  IF v_split_count = 0 THEN
    RAISE EXCEPTION 'expense % must have at least one split', p_expense_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_share_total <> v_total_amount THEN
    RAISE EXCEPTION
      'expense % split total (%) does not match total_amount (%)',
      p_expense_id, v_share_total, v_total_amount
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_split_method = 'PERCENTAGE' THEN
    IF v_missing_percentage > 0 THEN
      RAISE EXCEPTION
        'expense % uses PERCENTAGE but has splits without a percentage',
        p_expense_id
        USING ERRCODE = 'check_violation';
    END IF;

    IF v_percentage_total <> 100 THEN
      RAISE EXCEPTION
        'expense % percentages sum to %, expected 100',
        p_expense_id, v_percentage_total
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION validate_expense_split_integrity_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM validate_expense_split_integrity(OLD.expense_id);
    RETURN NULL;
  END IF;

  PERFORM validate_expense_split_integrity(NEW.expense_id);

  IF TG_OP = 'UPDATE' AND OLD.expense_id <> NEW.expense_id THEN
    PERFORM validate_expense_split_integrity(OLD.expense_id);
  END IF;

  RETURN NULL;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION validate_expense_splits_for_expense_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_expense_split_integrity(NEW.id);
  RETURN NULL;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS expense_splits_integrity_trigger ON expense_splits;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER expense_splits_integrity_trigger
AFTER INSERT OR UPDATE OR DELETE ON expense_splits
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_expense_split_integrity_trigger();--> statement-breakpoint

DROP TRIGGER IF EXISTS expenses_splits_integrity_trigger ON expenses;--> statement-breakpoint

CREATE CONSTRAINT TRIGGER expenses_splits_integrity_trigger
AFTER INSERT OR UPDATE ON expenses
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION validate_expense_splits_for_expense_trigger();
