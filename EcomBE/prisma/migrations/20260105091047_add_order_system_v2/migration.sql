BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[master_orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [order_code] NVARCHAR(1000) NOT NULL,
    [total_amount] DECIMAL(12,2) NOT NULL,
    [shipping_fee] DECIMAL(12,2) NOT NULL CONSTRAINT [master_orders_shipping_fee_df] DEFAULT 0,
    [platform_discount] DECIMAL(12,2) NOT NULL CONSTRAINT [master_orders_platform_discount_df] DEFAULT 0,
    [receiver_name] NVARCHAR(1000) NOT NULL,
    [receiver_phone] NVARCHAR(1000) NOT NULL,
    [shipping_address] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [master_orders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [master_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [master_orders_order_code_key] UNIQUE NONCLUSTERED ([order_code])
);

-- CreateTable
CREATE TABLE [dbo].[sub_orders] (
    [id] NVARCHAR(1000) NOT NULL,
    [master_order_id] NVARCHAR(1000) NOT NULL,
    [shop_id] NVARCHAR(1000) NOT NULL,
    [sub_order_code] NVARCHAR(1000) NOT NULL,
    [items_total] DECIMAL(12,2) NOT NULL,
    [shipping_fee] DECIMAL(12,2) NOT NULL CONSTRAINT [sub_orders_shipping_fee_df] DEFAULT 0,
    [discount_amount] DECIMAL(12,2) NOT NULL CONSTRAINT [sub_orders_discount_amount_df] DEFAULT 0,
    [total_amount] DECIMAL(12,2) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [sub_orders_status_df] DEFAULT 'PENDING_PAYMENT',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [sub_orders_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [sub_orders_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sub_orders_sub_order_code_key] UNIQUE NONCLUSTERED ([sub_order_code])
);

-- CreateTable
CREATE TABLE [dbo].[payments] (
    [id] NVARCHAR(1000) NOT NULL,
    [master_order_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [payment_method] NVARCHAR(1000) NOT NULL,
    [total_amount] DECIMAL(12,2) NOT NULL,
    [transaction_id] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [payments_status_df] DEFAULT 'PENDING',
    [paid_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [payments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [payments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[payment_allocations] (
    [id] NVARCHAR(1000) NOT NULL,
    [payment_id] NVARCHAR(1000) NOT NULL,
    [sub_order_id] NVARCHAR(1000) NOT NULL,
    [amount] DECIMAL(12,2) NOT NULL,
    [refunded_amount] DECIMAL(12,2) NOT NULL CONSTRAINT [payment_allocations_refunded_amount_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [payment_allocations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [payment_allocations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[refunds] (
    [id] NVARCHAR(1000) NOT NULL,
    [sub_order_id] NVARCHAR(1000) NOT NULL,
    [payment_id] NVARCHAR(1000),
    [amount] DECIMAL(12,2) NOT NULL,
    [reason] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [refunds_status_df] DEFAULT 'REQUESTED',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [refunds_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [refunds_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[order_items] (
    [id] NVARCHAR(1000) NOT NULL,
    [sub_order_id] NVARCHAR(1000) NOT NULL,
    [product_id] NVARCHAR(1000) NOT NULL,
    [variant_id] NVARCHAR(1000),
    [quantity] INT NOT NULL,
    [price] DECIMAL(12,2) NOT NULL,
    [product_name] NVARCHAR(1000) NOT NULL,
    [variant_name] NVARCHAR(1000),
    [total_price] DECIMAL(12,2) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [order_items_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [order_items_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[master_orders] ADD CONSTRAINT [master_orders_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sub_orders] ADD CONSTRAINT [sub_orders_master_order_id_fkey] FOREIGN KEY ([master_order_id]) REFERENCES [dbo].[master_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sub_orders] ADD CONSTRAINT [sub_orders_shop_id_fkey] FOREIGN KEY ([shop_id]) REFERENCES [dbo].[shops]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_master_order_id_fkey] FOREIGN KEY ([master_order_id]) REFERENCES [dbo].[master_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payment_allocations] ADD CONSTRAINT [payment_allocations_payment_id_fkey] FOREIGN KEY ([payment_id]) REFERENCES [dbo].[payments]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[payment_allocations] ADD CONSTRAINT [payment_allocations_sub_order_id_fkey] FOREIGN KEY ([sub_order_id]) REFERENCES [dbo].[sub_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[refunds] ADD CONSTRAINT [refunds_sub_order_id_fkey] FOREIGN KEY ([sub_order_id]) REFERENCES [dbo].[sub_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_sub_order_id_fkey] FOREIGN KEY ([sub_order_id]) REFERENCES [dbo].[sub_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[order_items] ADD CONSTRAINT [order_items_product_id_fkey] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
