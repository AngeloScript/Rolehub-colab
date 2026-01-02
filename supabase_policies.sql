-- Habilitar RLS na tabela direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
-- Política para permitir que usuários autenticados INSERIAM mensagens
-- Verificamos se o sender_id corresponde ao ID do usuário autenticado para evitar falsificação
CREATE POLICY "Permitir insert autenticado" ON direct_messages FOR
INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
-- Política para permitir que usuários VEJAM mensagens das quais fazem parte
-- Assumindo que a tabela direct_messages tem sender_id, mas a verificação de "destinatário" é mais complexa se não houver recipient_id direto.
-- Geralmente verificamos se o usuário participa da 'conversation' relacionada.
-- Se houver uma tabela de conversations com array de participants:
CREATE POLICY "Permitir select para participantes" ON direct_messages FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM conversations c
            WHERE c.id = direct_messages.conversation_id
                AND array_position(c.participants, auth.uid()) IS NOT NULL
        )
    );
-- Política simples para Notifications (caso também esteja falhando)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários podem ver suas próprias notificações" ON notifications FOR
SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar notificações para outros" ON notifications FOR
INSERT TO authenticated WITH CHECK (true);
-- Permitimos criar para qualquer um (necessário para enviar msg inter-usuários)