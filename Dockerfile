FROM node:16

RUN mkdir -p /app

ARG SELECTED_CONFIG=stage
ENV SELECTED_CONFIG=$SELECTED_CONFIG

COPY package.json /app

WORKDIR /app

RUN npm install

COPY . /app

RUN npm run build

RUN cp config.$SELECTED_CONFIG.json ./dist/config.json

CMD ["npm", "start"]
