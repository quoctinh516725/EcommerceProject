BEGIN TRY
BEGIN TRAN;

-- 1. Drop default constraint on shipping_fee if it exists
DECLARE @sql NVARCHAR(MAX) = '';
SELECT @sql += 'ALTER TABLE [dbo].[master_orders] DROP CONSTRAINT ' + QUOTENAME(dc.name) + ';'
FROM sys.default_constraints dc
JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE OBJECT_NAME(dc.parent_object_id) = 'master_orders' AND c.name = 'shipping_fee';

IF @sql <> '' EXEC sp_executesql @sql;

-- 2. Drop shipping_fee column
ALTER TABLE [dbo].[master_orders] DROP COLUMN [shipping_fee];

-- 3. Rename total_amount to original_total_amount
-- This is safer for data preservation and avoids batch parsing issues
EXEC sp_rename '[dbo].[master_orders].[total_amount]', 'original_total_amount', 'COLUMN';

-- 4. Create unique constraint on payment_allocations
-- Shadow DB might already have it if we're retrying, but usually TRAN handles it.
-- Added if not exists check to be ultra-safe for shadow DB environments.
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'payment_allocations_payment_id_sub_order_id_key' AND parent_object_id = OBJECT_ID('[dbo].[payment_allocations]'))
BEGIN
    ALTER TABLE [dbo].[payment_allocations] ADD CONSTRAINT [payment_allocations_payment_id_sub_order_id_key] UNIQUE NONCLUSTERED ([payment_id], [sub_order_id]);
END;

COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRAN;
    THROW;
END CATCH;
