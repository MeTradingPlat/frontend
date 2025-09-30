FROM node:22.19.0 as build
WORKDIR /app/src
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM node:22.19.0
WORKDIR /usr/app
COPY --from=build /app/src/dist/PROJECT_NAME ./
CMD node server/server.mjs
EXPOSE 4000