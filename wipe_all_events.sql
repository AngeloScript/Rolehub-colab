-- EXCLUIR TODOS OS EVENTOS E DADOS RELACIONADOS
-- Execute este script no SQL Editor do Supabase para limpar os dados de teste.
-- 1. Excluir Tickets (ingressos vinculados a eventos)
DELETE FROM tickets;
-- 1.5. Excluir Mensagens do Chat do Evento (que dependem do event_id)
-- Esta tabela estava bloqueando a exclusão dos eventos.
DELETE FROM chat_messages;
-- 2. Excluir Comentários de Eventos (se houver tabela separada ou genérica)
-- Assumindo que pode haver uma tabela 'comments' ou similar vinculada. 
-- Se der erro porque a tabela não existe, apenas ignore.
-- DELETE FROM comments WHERE event_id IS NOT NULL; 
-- 3. Excluir Fotos de Eventos
DELETE FROM event_photos;
-- 4. Excluir Eventos Salvos (referências em array de usuários ou tabela de junção)
-- Nota: Se for um array no JSONB ou array[] na tabela users, pode ser complexo limpar via SQL simples sem afetar o user.
-- Mas se for tabela 'saved_events':
-- DELETE FROM saved_events;
-- 5. FINALMENTE: Excluir os Eventos
DELETE FROM events;
-- Opcional: Limpar conversas e mensagens se for um "hard reset" total
-- DELETE FROM direct_messages;
-- DELETE FROM conversations;
-- Opcional: Limpar notificações antigas
-- DELETE FROM notifications;
-- Se o seu banco tiver chaves estrangeiras com CASCADE configurado, apenas 'DELETE FROM events;' funcionaria.
-- Caso contrário, a ordem acima garante a integridade.