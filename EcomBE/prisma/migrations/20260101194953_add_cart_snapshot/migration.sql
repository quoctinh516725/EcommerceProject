BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[cart_snapshots] (
    [user_id] NVARCHAR(1000) NOT NULL,
    [items] NVARCHAR(max) NOT NULL,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [cart_snapshots_pkey] PRIMARY KEY CLUSTERED ([user_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[cart_snapshots] ADD CONSTRAINT [cart_snapshots_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
