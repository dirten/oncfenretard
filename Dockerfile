FROM node:8

ENV REDIS_URL=redis://redis:6379

RUN mkdir -p /app
WORKDIR /app
ADD . ./
RUN npm install

ENTRYPOINT ["node"]
