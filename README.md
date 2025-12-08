# Documento de Especificação de Projeto: RoleHub

## 1. Visão Geral e Objetivo do Projeto

**Objetivo Principal:** O RoleHub é uma plataforma social de descoberta de eventos, concebida com uma abordagem "mobile-first". O seu propósito central é conectar pessoas a eventos locais de seu interesse (apelidados de "rolês") e, mais importante, conectar pessoas a outras pessoas com gostos similares. O aplicativo deve ir além de uma simples listagem, fomentando um senso de comunidade e antecipação em torno dos acontecimentos.

**Público-Alvo:** Jovens adultos (18-35 anos) urbanos, socialmente ativos, que procuram novas experiências, gostam de música, arte, tecnologia e cultura, e valorizam a formação de novas conexões sociais.

**Proposta de Valor:** Em um mundo digital que muitas vezes isola, o RoleHub é a ponte para experiências reais e conexões humanas. Ele não apenas te diz "o que" está acontecendo, mas também "quem" está indo, transformando cada evento em uma oportunidade de socialização.

---

## 2. Escopo de Funcionalidades (MVP - Produto Mínimo Viável)

### **Módulo 1: Autenticação e Perfil de Usuário**

-   **[1.1] Cadastro e Login:**
    -   Permitir que usuários se cadastrem com Nome, E-mail e Senha.
    -   Implementar um fluxo de login seguro.
    -   Utilizar **Firebase Authentication** para gerenciamento de usuários.
    -   Páginas dedicadas: `/login` e `/register`.

-   **[1.2] Perfil de Usuário (`/profile`):**
    -   **Visualização:** Exibir avatar, nome, e-mail, bio, e contadores (Seguindo, Seguidores, Eventos Criados).
    -   **Edição:** Permitir que o usuário edite seu nome, bio e status de relacionamento (`solteiro`, `namorando`, `não especificado`).
    -   **Upload de Avatar:** Implementar funcionalidade de upload de imagem para o avatar. As imagens devem ser armazenadas no **Supabase Storage**.
    -   **Listas de Eventos:** O perfil deve ter duas abas: "Eventos Salvos" e "Eventos Organizados", listando os respectivos eventos em formato de card.

### **Módulo 2: Core de Eventos ("Rolês")**

-   **[2.1] Feed de Eventos (`/events`):**
    -   **Visualização Híbrida:** A tela principal deve permitir alternar entre uma visualização em lista e uma em mapa.
    -   **Cards de Evento:** A visualização em lista deve exibir eventos como cards. Cada card deve conter: Imagem do evento, Título, Data, Hora, Nome do Local, e número de participantes confirmados.
    -   **Mapa Interativo:** A visualização em mapa (`react-leaflet` com OpenStreetMap) deve exibir pinos para cada evento. Os pinos devem ser customizados com a cor primária do tema do evento. Clicar em um pino deve abrir um pop-up com informações rápidas e um botão para ver detalhes.
    -   **Busca e Filtro:** Uma barra de busca para pesquisar eventos por texto e um menu para filtrar por tags (ex: `música`, `arte`).

-   **[2.2] Detalhes do Evento (`/events/[id]`):**
    -   **Página Dinâmica:** Renderizar uma página única para cada evento. O design (cores de botões e highlights) deve usar a paleta de cores (primária, secundária, fundo) definida para o evento.
    -   **Informações Completas:** Exibir banner, título, descrição completa, data, hora, local, organizador (com link para o perfil) e lista de participantes.
    -   **Mapa de Localização:** Exibir um mapa focado exclusivamente na localização do evento.
    -   **Interação Social:**
        -   Botão "Eu Vou!" para confirmar presença.
        -   Botão para Salvar o evento no perfil.
        -   Contador de participantes em tempo real.
    -   **Seção de Comentários:** Permitir que usuários logados postem e vejam comentários.

-   **[2.3] Criação de Eventos (`/events/create`):**
    -   **Formulário Completo:** Formulário para usuários autenticados criarem novos eventos, incluindo: Título, Descrição, Local (endereço em texto), Data, Hora, Tags (separadas por vírgula) e upload de imagem do banner.
    -   **Geocodificação Automática:** Ao digitar o endereço no campo "Local", usar a API **Nominatim** para obter as coordenadas (latitude e longitude) e salvar no banco de dados.
    -   **Assistência de IA (Genkit):**
        -   **Gerador de Detalhes:** A partir do campo "Título", um botão "Gerar com IA" deve usar o Gemini (via Genkit) para preencher automaticamente: `Descrição`, `Local`, `Data`, `Hora` e `Tags`.
        -   **Gerador de Tema de Cores:** Após o upload do banner, a IA deve analisar a imagem e sugerir uma paleta de cores (primária, secundária, fundo) que será salva junto com o evento.

### **Módulo 3: Social e Comunicação**

-   **[3.1] Sistema de Seguir:**
    -   Permitir que usuários sigam e deixem de seguir outros a partir de seus perfis.
    -   Atualizar os contadores de `seguidores` e `seguindo` nos documentos dos usuários no Firestore.

-   **[3.2] Mensagens (`/messages`):**
    -   Implementar uma tela de chat básica para conversas 1-para-1 entre usuários. (Inicialmente pode ser com dados mocados, mas a estrutura deve ser criada).

-   **[3.3] Notificações (`/notifications`):**
    -   Criar uma central para o usuário ver atualizações, como novos seguidores, comentários em seus eventos, etc. (Também pode ser mocada inicialmente).

---

## 3. Arquitetura e Stack Técnica Sugerida

-   **Framework Frontend:** **Next.js** com **App Router**.
-   **Linguagem:** **TypeScript**.
-   **Estilização:** **Tailwind CSS** com **`shadcn/ui`** para a biblioteca de componentes. O tema de cores principal (dark com detalhes em neon) deve ser definido em `src/app/globals.css` usando variáveis HSL.
-   **Banco de Dados:** **Firebase Firestore**. A estrutura de dados deve ser bem definida:
    -   `users/{userId}`: Documento para cada usuário.
    -   `events/{eventId}`: Documento para cada evento.
    -   `events/{eventId}/comments/{commentId}`: Sub-coleção para comentários.
    -   `events/{eventId}/chat/{messageId}`: Sub-coleção para o chat do evento.
-   **Autenticação:** **Firebase Authentication**.
-   **Armazenamento de Arquivos:** **Supabase Storage** (especificamente para avatares de usuários e banners de eventos).
-   **Funcionalidades de IA:** **Genkit** com a API do **Google Gemini** para geração de texto e análise de imagens.
-   **Mapas:** **`react-leaflet`** (baseado em OpenStreetMap) para exibição e a API **Nominatim** para geocodificação.
-   **Animações:** **`framer-motion`** para transições de página e micro-interações.

---

## 4. Visão de Futuro e Próximos Passos (Pós-MVP)

1.  **Recomendações Inteligentes:** Criar um *flow* de Genkit que analise os eventos salvos/participados pelo usuário para sugerir proativamente novos eventos em uma seção "Para Você" no feed.
2.  **Chat do Rolê em Tempo Real:** Ativar a funcionalidade de chat em grupo para cada evento. Ao confirmar presença ("Eu Vou!"), o usuário ganha acesso ao chat com os outros participantes, usando o Firestore para tempo real.
3.  **Gamificação e Check-in:** Aprimorar o sistema de check-in, talvez com badges ou pontos por participar de eventos, incentivando o engajamento.
4.  **Feed de Atividades de Amigos:** Criar um feed onde o usuário possa ver as atividades de quem ele segue (ex: "NeonRider salvou o evento Cyberfunk Fest").
5.  **Integração com Calendários:** Permitir que os usuários exportem eventos para o Google Calendar/Apple Calendar.
6.  **Melhorias na UI/UX:** Adicionar mais animações, feedback de loading, e estados vazios mais elaborados para uma experiência mais polida.
7.  **Push Notifications:** Implementar notificações push via Firebase Cloud Messaging para lembrar os usuários sobre eventos salvos ou novas mensagens.# Rolehub
# Rolehub
