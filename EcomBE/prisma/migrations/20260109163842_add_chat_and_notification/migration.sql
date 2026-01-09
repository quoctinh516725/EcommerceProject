BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[conversations] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [shop_id] NVARCHAR(1000) NOT NULL,
    [last_message] NVARCHAR(1000),
    [last_message_at] DATETIME2 NOT NULL CONSTRAINT [conversations_last_message_at_df] DEFAULT CURRENT_TIMESTAMP,
    [unread_count_user] INT NOT NULL CONSTRAINT [conversations_unread_count_user_df] DEFAULT 0,
    [unread_count_shop] INT NOT NULL CONSTRAINT [conversations_unread_count_shop_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [conversations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [conversations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [conversations_user_id_shop_id_key] UNIQUE NONCLUSTERED ([user_id],[shop_id])
);

-- CreateTable
CREATE TABLE [dbo].[messages] (
    [id] NVARCHAR(1000) NOT NULL,
    [conversation_id] NVARCHAR(1000) NOT NULL,
    [sender_id] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [message_type] NVARCHAR(1000) NOT NULL CONSTRAINT [messages_message_type_df] DEFAULT 'TEXT',
    [is_read] BIT NOT NULL CONSTRAINT [messages_is_read_df] DEFAULT 0,
    [sent_at] DATETIME2 NOT NULL CONSTRAINT [messages_sent_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [messages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[notifications] (
    [id] NVARCHAR(1000) NOT NULL,
    [user_id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [reference_id] NVARCHAR(1000),
    [reference_type] NVARCHAR(1000),
    [is_read] BIT NOT NULL CONSTRAINT [notifications_is_read_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [notifications_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [notifications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [conversations_user_id_idx] ON [dbo].[conversations]([user_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [conversations_shop_id_idx] ON [dbo].[conversations]([shop_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [messages_conversation_id_sent_at_idx] ON [dbo].[messages]([conversation_id], [sent_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [notifications_user_id_is_read_idx] ON [dbo].[notifications]([user_id], [is_read]);

-- AddForeignKey
ALTER TABLE [dbo].[conversations] ADD CONSTRAINT [conversations_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[conversations] ADD CONSTRAINT [conversations_shop_id_fkey] FOREIGN KEY ([shop_id]) REFERENCES [dbo].[shops]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_conversation_id_fkey] FOREIGN KEY ([conversation_id]) REFERENCES [dbo].[conversations]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[messages] ADD CONSTRAINT [messages_sender_id_fkey] FOREIGN KEY ([sender_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[notifications] ADD CONSTRAINT [notifications_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
