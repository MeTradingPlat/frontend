FROM node:22.19.0 as build
WORKDIR /usr/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22.19.0
WORKDIR /usr/app
COPY --from=build /usr/app/dist/frontend ./dist/frontend
COPY --from=build /usr/app/package*.json ./
RUN npm ci --omit=dev
CMD node dist/frontend/server/server.mjs
EXPOSE 4000