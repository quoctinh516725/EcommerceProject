BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[roles] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [roles_status_df] DEFAULT 'ACTIVE',
    [created_at] DATETIME2 NOT NULL CONSTRAINT [roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [roles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [roles_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[permissions] (
    [id] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [permissions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [permissions_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[user_roles] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [role_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [user_roles_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [user_roles_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_roles_user_id_role_id_key] UNIQUE NONCLUSTERED ([user_id],[role_id])
);

-- CreateTable
CREATE TABLE [dbo].[role_permissions] (
    [id] NVARCHAR(1000) NOT NULL,
    [role_id] NVARCHAR(1000) NOT NULL,
    [permission_id] NVARCHAR(1000) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [role_permissions_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [role_permissions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [role_permissions_role_id_permission_id_key] UNIQUE NONCLUSTERED ([role_id],[permission_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[user_roles] ADD CONSTRAINT [user_roles_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_permissions] ADD CONSTRAINT [role_permissions_role_id_fkey] FOREIGN KEY ([role_id]) REFERENCES [dbo].[roles]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[role_permissions] ADD CONSTRAINT [role_permissions_permission_id_fkey] FOREIGN KEY ([permission_id]) REFERENCES [dbo].[permissions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
