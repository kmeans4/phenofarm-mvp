-- Widen existing selling-unit quantities without changing any existing value or unit.
-- Exact decimal arithmetic avoids cumulative stock drift. Counts are additionally
-- validated against the product unit/type by all application mutation paths.
BEGIN;
SET LOCAL lock_timeout = '15s';
LOCK TABLE products, orders, order_items, conversation_messages, accepted_quotes IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
  IF (SELECT count(*) FROM pg_trigger WHERE tgname IN ('orders_inventory_writer_guard', 'order_items_inventory_writer_guard') AND NOT tgisinternal) <> 2 THEN
    RAISE EXCEPTION 'Install the inventory writer guards before this migration.';
  END IF;
END $$;
ALTER TABLE products ALTER COLUMN "inventoryQty" TYPE NUMERIC(16,3) USING "inventoryQty"::numeric;
ALTER TABLE order_items ALTER COLUMN quantity TYPE NUMERIC(16,3) USING quantity::numeric;
ALTER TABLE conversation_messages ALTER COLUMN "offerQuantity" TYPE NUMERIC(16,3) USING "offerQuantity"::numeric;
ALTER TABLE accepted_quotes ALTER COLUMN quantity TYPE NUMERIC(16,3) USING quantity::numeric;
ALTER TABLE products ADD CONSTRAINT products_nonnegative_stock CHECK ("inventoryQty" >= 0);
ALTER TABLE order_items ADD CONSTRAINT order_items_positive_quantity CHECK (quantity > 0);
ALTER TABLE conversation_messages ADD CONSTRAINT messages_positive_offer_quantity CHECK ("offerQuantity" IS NULL OR "offerQuantity" > 0);
ALTER TABLE accepted_quotes ADD CONSTRAINT quotes_positive_quantity CHECK (quantity IS NULL OR quantity > 0);
-- Prevent an old integer-only deployment from mutating fractional orders.
CREATE OR REPLACE FUNCTION phenoshop_require_inventory_writer() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('phenoshop.inventory_writer', true) IS DISTINCT FROM 'acceptance-v2' THEN
    RAISE EXCEPTION 'Order updates require the current inventory workflow. Refresh the app and try again.' USING ERRCODE = '55000';
  END IF;
  RETURN NULL;
END;
$$;
CREATE FUNCTION phenoshop_validate_product_quantity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (lower(NEW.unit) NOT IN ('gram','grams','g','oz','ounce','ounces','lb','lbs','pound','pounds') OR lower(regexp_replace(NEW."productType", '[- ]', '', 'g')) = 'preroll') AND NEW."inventoryQty" <> trunc(NEW."inventoryQty") THEN
    RAISE EXCEPTION 'Packs and pieces require whole quantities.' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.unit IS DISTINCT FROM OLD.unit OR NEW."productType" IS DISTINCT FROM OLD."productType") AND (
    EXISTS (SELECT 1 FROM order_items WHERE "productId" = OLD.id) OR
    EXISTS (SELECT 1 FROM accepted_quotes WHERE "productId" = OLD.id) OR
    EXISTS (SELECT 1 FROM conversation_messages WHERE "productId" = OLD.id)
  ) THEN
    RAISE EXCEPTION 'Create a new listing to change the selling unit or type of a product used in an order or quote.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER products_quantity_guard BEFORE INSERT OR UPDATE OF "inventoryQty", unit, "productType" ON products FOR EACH ROW EXECUTE FUNCTION phenoshop_validate_product_quantity();
COMMIT;
