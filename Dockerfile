FROM node:22-alpine

WORKDIR /home/node/app
COPY package.json .
RUN npm install

CMD npm start