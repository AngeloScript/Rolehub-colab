---
description: Atualizar projeto com alterações do repositório remoto
---

# Atualizar Projeto

Este workflow baixa as últimas alterações do GitHub antes de começar a trabalhar.

## Passos:

1. Verificar se há alterações locais não salvas
```bash
git status
```

2. Baixar as últimas alterações do repositório remoto
// turbo
```bash
git pull origin main
```

3. Confirmar que está atualizado
```bash
echo "✅ Projeto atualizado! Você pode começar a trabalhar."
```

## Quando usar:
- Sempre ANTES de começar a trabalhar no projeto
- Quando seu amigo avisar que fez alterações
- Depois de um tempo sem mexer no projeto
