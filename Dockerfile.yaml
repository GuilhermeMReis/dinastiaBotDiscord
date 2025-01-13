FROM node:18

# Define o diretório de trabalho
WORKDIR /usr/src/app

# Copia os arquivos necessários para o container
COPY . .

# Instala as dependências
RUN npm install

# Define as variáveis de ambiente
ENV DISCORD_TOKEN=MTMyODM1NjU2MjAzMjM5NDMzMg.GlyJ1d.N0RkFH2NPBQaZ9chCVMiMdmISdbrv6lNzzSCcA \
    DISCORD_CLIENT_ID=1328356562032394332 \
    DISCORD_GUILD_ID=1042167130503774368 \
    WEBHOOK_URL=https://dinastia-n8n-webhook.rdxzui.easypanel.host/webhook/discord-teste

# Expõe a porta 3000 para o container
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
