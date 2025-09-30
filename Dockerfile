FROM node:22.19.0 as build
WORKDIR /
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM node:22.19.0
WORKDIR /usr/app
COPY --from=build /dist/frontend ./
CMD node server/server.mjs
EXPOSE 4000