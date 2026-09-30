-- Drain in-flight order writers and fence every older deployment before cutover.
-- The marker is transaction-local: pooled connections cannot retain it.
BEGIN;
SET LOCAL lock_timeout = '15s';
LOCK TABLE orders, order_items IN SHARE ROW EXCLUSIVE MODE;
CREATE FUNCTION phenoshop_require_inventory_writer() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('phenoshop.inventory_writer', true) IS DISTINCT FROM 'acceptance-v1' THEN
    RAISE EXCEPTION 'Order updates require the current inventory workflow. Refresh the app and try again.'
      USING ERRCODE = '55000';
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER orders_inventory_writer_guard
BEFORE INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT EXECUTE FUNCTION phenoshop_require_inventory_writer();
CREATE TRIGGER order_items_inventory_writer_guard
BEFORE INSERT OR UPDATE OR DELETE ON order_items
FOR EACH STATEMENT EXECUTE FUNCTION phenoshop_require_inventory_writer();
COMMIT;
