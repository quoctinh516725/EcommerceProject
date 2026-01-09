BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[product_reviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [product_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [order_item_id] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000),
    [images] NVARCHAR(1000),
    [reply] NVARCHAR(1000),
    [reply_at] DATETIME2,
    [is_hidden] BIT NOT NULL CONSTRAINT [product_reviews_is_hidden_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [product_reviews_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [product_reviews_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [product_reviews_order_item_id_key] UNIQUE NONCLUSTERED ([order_item_id])
);

-- CreateTable
CREATE TABLE [dbo].[shop_reviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [shop_id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [sub_order_id] NVARCHAR(1000) NOT NULL,
    [rating] INT NOT NULL,
    [comment] NVARCHAR(1000),
    [reply] NVARCHAR(1000),
    [reply_at] DATETIME2,
    [is_hidden] BIT NOT NULL CONSTRAINT [shop_reviews_is_hidden_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [shop_reviews_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [shop_reviews_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [shop_reviews_sub_order_id_key] UNIQUE NONCLUSTERED ([sub_order_id])
);

-- CreateTable
CREATE TABLE [dbo].[review_reports] (
    [id] NVARCHAR(1000) NOT NULL,
    [product_review_id] NVARCHAR(1000),
    [reporter_id] NVARCHAR(1000) NOT NULL,
    [reason] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [review_reports_status_df] DEFAULT 'PENDING',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [review_reports_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [review_reports_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[product_reviews] ADD CONSTRAINT [product_reviews_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[product_reviews] ADD CONSTRAINT [product_reviews_order_item_id_fkey] FOREIGN KEY ([order_item_id]) REFERENCES [dbo].[order_items]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[product_reviews] ADD CONSTRAINT [product_reviews_product_id_fkey] FOREIGN KEY ([product_id]) REFERENCES [dbo].[products]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[shop_reviews] ADD CONSTRAINT [shop_reviews_shop_id_fkey] FOREIGN KEY ([shop_id]) REFERENCES [dbo].[shops]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[shop_reviews] ADD CONSTRAINT [shop_reviews_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[shop_reviews] ADD CONSTRAINT [shop_reviews_sub_order_id_fkey] FOREIGN KEY ([sub_order_id]) REFERENCES [dbo].[sub_orders]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_reports] ADD CONSTRAINT [review_reports_product_review_id_fkey] FOREIGN KEY ([product_review_id]) REFERENCES [dbo].[product_reviews]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[review_reports] ADD CONSTRAINT [review_reports_reporter_id_fkey] FOREIGN KEY ([reporter_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
