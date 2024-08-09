FROM node:22-alpine

RUN mkdir -p /home/node/app/pictures
RUN mkdir -p /home/node/app/www-files

WORKDIR /home/node/app
COPY package.json .
RUN npm install

CMD npm start