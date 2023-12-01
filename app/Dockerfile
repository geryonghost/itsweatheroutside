FROM node:alpine as base

WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@10.2.4 && npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]