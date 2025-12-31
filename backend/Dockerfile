FROM node:24-alpine

WORKDIR /home/jon/project/Forum

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
