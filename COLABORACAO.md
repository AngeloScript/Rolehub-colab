# 🤝 Guia de Colaboração - RoleHub

## 📋 Comandos Diários

### Antes de começar a trabalhar
```bash
git pull origin main
```

### Depois de fazer alterações
```bash
git add .
git commit -m "Descrição do que você fez"
git push origin main
```

---

## 🚀 Configuração Inicial (Primeiro Uso)

### Para quem vai clonar o projeto pela primeira vez:

1. **Clonar o repositório:**
```bash
git clone https://github.com/AngeloScript/Rolehub-colab.git
cd Rolehub-colab
```

2. **Instalar dependências:**
```bash
npm install
```

3. **Criar arquivo `.env.local`** na raiz do projeto com:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kjwbbweenyozeodmsdkw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqd2Jid2VlbnlvemVvZG1zZGt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTEwNjgsImV4cCI6MjA3OTMyNzA2OH0.U753DsEFJ7Pv2Nlg29sgMmGkRnpuOg5H8AnVxbsiPH4

# Google AI (Genkit) Configuration
GOOGLE_GENAI_API_KEY=your-google-ai-api-key-here
```

4. **Rodar o servidor:**
```bash
npm run dev
```

5. **Acessar:** http://localhost:9002

---

## 🔄 Fluxo de Trabalho Completo

### Cenário 1: Você fez alterações
```bash
# 1. Verificar o que mudou
git status

# 2. Adicionar todas as mudanças
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "Adiciona página de perfil do usuário"

# 4. Enviar para o GitHub
git push origin main
```

### Cenário 2: Seu amigo fez alterações
```bash
# 1. Baixar as alterações dele
git pull origin main

# 2. Se houver conflitos, resolver e depois:
git add .
git commit -m "Resolve conflitos"
git push origin main
```

---

## ⚠️ Evitando Conflitos

1. **Sempre faça `git pull` antes de começar a trabalhar**
2. **Comunique-se** sobre quais arquivos estão editando
3. **Faça commits pequenos e frequentes**
4. **Não edite o mesmo arquivo ao mesmo tempo**

---

## 🆘 Comandos Úteis

### Ver histórico de commits
```bash
git log --oneline
```

### Ver diferenças antes de commitar
```bash
git diff
```

### Desfazer alterações não commitadas
```bash
git checkout -- .
```

### Ver status atual
```bash
git status
```

### Ver branches
```bash
git branch
```

---

## 🌿 Trabalhando com Branches (Avançado)

Se quiserem trabalhar em features separadas sem interferir um no outro:

### Criar uma nova branch
```bash
git checkout -b feature/nome-da-feature
```

### Trabalhar na branch
```bash
git add .
git commit -m "Implementa nova feature"
git push origin feature/nome-da-feature
```

### Voltar para a branch principal
```bash
git checkout main
```

### Mesclar a branch na main
```bash
git checkout main
git merge feature/nome-da-feature
git push origin main
```

---

## 📞 Suporte

Se tiver dúvidas, consulte:
- [Documentação Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
