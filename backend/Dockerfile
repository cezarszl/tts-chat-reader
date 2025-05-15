FROM node:23-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

RUN npm run build
EXPOSE 3000
CMD ["node", "index.js"]
