# Dockerfile para RoleHub - Desenvolvimento
FROM node:24-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar todo o código do projeto
COPY . .

# Expor a porta 9002 (configurada no package.json)
EXPOSE 9002

# Comando para iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev"]
