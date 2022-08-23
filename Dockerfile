FROM node:16

RUN mkdir -p /app

COPY package.json /app

WORKDIR /app

RUN npm install

COPY . /app

RUN npm run build

RUN cp config.json ./dist/config.json

CMD ["npm", "start"]
