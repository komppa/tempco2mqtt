FROM node:18

WORKDIR /home/ci/project

COPY package*.json ./

RUN npm install

COPY . /home/ci/project/.

RUN npm run pre

CMD ["npm", "run", "build"]