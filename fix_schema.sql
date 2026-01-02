-- PASSO 1: Garantir que as tabelas existem (DDL)
-- Isso alinha o Banco de Dados com o que o código TypeScript espera.
-- Tabela de Conversas
CREATE TABLE IF NOT EXISTS conversations (
    id text PRIMARY KEY,
    -- ID composto ex: "user1_user2"
    participants uuid [] NOT NULL,
    -- Array de IDs de usuários
    last_message text,
    last_message_timestamp timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);
-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS direct_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id text NOT NULL REFERENCES conversations(id),
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    text text,
    media_url text,
    media_type text,
    -- 'image', 'video', 'audio'
    status text DEFAULT 'sent',
    -- 'sent', 'delivered', 'read'
    created_at timestamptz DEFAULT now()
);
-- PASSO 2: Habilitar Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
-- PASSO 3: Criar/Recriar Políticas de Segurança
-- Removemos as antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON direct_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON direct_messages;
-- Políticas para Conversations
CREATE POLICY "Users can view conversations they are part of" ON conversations FOR
SELECT USING (auth.uid() = ANY(participants));
CREATE POLICY "Users can insert conversations" ON conversations FOR
INSERT WITH CHECK (auth.uid() = ANY(participants));
CREATE POLICY "Users can update conversations" ON conversations FOR
UPDATE USING (auth.uid() = ANY(participants));
-- Políticas para Direct Messages
CREATE POLICY "Users can view messages in their conversations" ON direct_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = direct_messages.conversation_id
                AND auth.uid() = ANY(c.participants)
        )
    );
CREATE POLICY "Users can insert messages" ON direct_messages FOR
INSERT WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = conversation_id
                AND auth.uid() = ANY(c.participants)
        )
    );
-- BÔNUS: Notifications (caso não exista)
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    type text NOT NULL,
    text text NOT NULL,
    link text,
    read boolean DEFAULT false,
    sender_name text,
    sender_avatar text,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR
SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Allow system/users to insert notifications" ON notifications;
CREATE POLICY "Allow system/users to insert notifications" ON notifications FOR
INSERT WITH CHECK (true);