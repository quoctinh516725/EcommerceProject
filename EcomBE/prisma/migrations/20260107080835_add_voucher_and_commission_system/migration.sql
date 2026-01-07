BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[shops] ADD [commission_rate] DECIMAL(5,4);

-- AlterTable
ALTER TABLE [dbo].[sub_orders] ADD [commission_amount] DECIMAL(12,2) NOT NULL CONSTRAINT [sub_orders_commission_amount_df] DEFAULT 0,
[real_amount] DECIMAL(12,2) NOT NULL CONSTRAINT [sub_orders_real_amount_df] DEFAULT 0;

-- CreateTable
CREATE TABLE [dbo].[vouchers] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [type] NVARCHAR(1000) NOT NULL,
    [shop_id] NVARCHAR(1000),
    [discount_type] NVARCHAR(1000) NOT NULL,
    [discount_value] DECIMAL(12,2) NOT NULL,
    [min_order_value] DECIMAL(12,2),
    [max_discount_amount] DECIMAL(12,2),
    [usage_limit] INT NOT NULL,
    [usage_count] INT NOT NULL CONSTRAINT [vouchers_usage_count_df] DEFAULT 0,
    [start_date] DATETIME2 NOT NULL,
    [end_date] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [vouchers_status_df] DEFAULT 'ACTIVE',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [vouchers_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [vouchers_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [vouchers_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[voucher_usages] (
    [id] NVARCHAR(1000) NOT NULL,
    [voucher_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [master_order_id] NVARCHAR(1000) NOT NULL,
    [discount_applied] DECIMAL(12,2) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [voucher_usages_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [voucher_usages_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [voucher_usages_voucher_id_master_order_id_key] UNIQUE NONCLUSTERED ([voucher_id],[master_order_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[vouchers] ADD CONSTRAINT [vouchers_shop_id_fkey] FOREIGN KEY ([shop_id]) REFERENCES [dbo].[shops]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[voucher_usages] ADD CONSTRAINT [voucher_usages_voucher_id_fkey] FOREIGN KEY ([voucher_id]) REFERENCES [dbo].[vouchers]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
