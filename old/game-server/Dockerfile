FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json ./
RUN npm install --only=production

COPY server.js ./

CMD ["npm", "start"]
