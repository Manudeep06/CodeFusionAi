FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache python3 make g++ && \
    npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
