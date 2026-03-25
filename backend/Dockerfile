FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY src ./src

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
