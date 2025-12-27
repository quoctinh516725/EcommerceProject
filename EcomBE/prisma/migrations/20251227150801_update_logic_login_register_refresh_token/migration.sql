BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [password] NVARCHAR(1000) NOT NULL,
    [full_name] NVARCHAR(1000),
    [avatar_url] NVARCHAR(1000),
    [gender] NVARCHAR(1000),
    [date_of_birth] DATE,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [users_status_df] DEFAULT 'ACTIVE',
    [last_login_at] DATETIME2,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[refresh_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expired_at] DATETIME2 NOT NULL,
    [revoked] BIT NOT NULL CONSTRAINT [refresh_tokens_revoked_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [refresh_tokens_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [refresh_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [refresh_tokens_token_key] UNIQUE NONCLUSTERED ([token])
);

-- AddForeignKey
ALTER TABLE [dbo].[refresh_tokens] ADD CONSTRAINT [refresh_tokens_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
