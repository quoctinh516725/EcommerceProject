BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[shop_shipping_rules] (
    [id] NVARCHAR(1000) NOT NULL,
    [shop_id] NVARCHAR(1000) NOT NULL,
    [base_fee] DECIMAL(12,2) NOT NULL CONSTRAINT [shop_shipping_rules_base_fee_df] DEFAULT 0,
    [extra_per_item] DECIMAL(12,2) NOT NULL CONSTRAINT [shop_shipping_rules_extra_per_item_df] DEFAULT 0,
    [free_ship_min] DECIMAL(12,2),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [shop_shipping_rules_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [shop_shipping_rules_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [shop_shipping_rules_shop_id_key] UNIQUE NONCLUSTERED ([shop_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[shop_shipping_rules] ADD CONSTRAINT [shop_shipping_rules_shop_id_fkey] FOREIGN KEY ([shop_id]) REFERENCES [dbo].[shops]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
