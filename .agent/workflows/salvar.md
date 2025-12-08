---
description: Salvar alterações no Git e enviar para o GitHub
---

# Salvar Alterações no Git

Este workflow salva suas alterações locais e envia para o GitHub.

## Passos:

1. Verificar quais arquivos foram modificados
```bash
git status
```

2. Adicionar todas as alterações
```bash
git add .
```

3. Fazer commit com mensagem descritiva
```bash
git commit -m "Alterações realizadas em [DATA_HORA]"
```

4. Enviar para o GitHub
```bash
git push origin main
```

5. Confirmar que foi salvo
```bash
echo "✅ Alterações salvas e enviadas para o GitHub!"
```

## Quando usar:
- Sempre DEPOIS de terminar de trabalhar
- Quando completar uma funcionalidade
- Antes de fechar o computador
- Quando quiser que seu amigo veja suas alterações

## Nota:
O assistente vai pedir uma descrição do que você fez para criar um commit mais descritivo.
