FROM node:20-alpine
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Copy application files and static assets
COPY . .

# Cloud environments dynamically set PORT
ENV PORT=18888
EXPOSE 18888

CMD ["node", "server.mjs"]
