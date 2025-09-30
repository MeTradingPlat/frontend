# Etapa 1: Build SSR
FROM node:22.19.0 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build:ssr

# Etapa 2: Producción SSR
FROM node:22.19.0
WORKDIR /app
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
CMD ["node", "dist/server/main.js"]
EXPOSE 4000