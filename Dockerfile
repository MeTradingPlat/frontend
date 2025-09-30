FROM node:22.19.0 AS build
WORKDIR /usr/app

# Copiar configuración
COPY package*.json ./
COPY angular.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src ./src
COPY public ./public

# Build (esto genera dist/frontend/browser y dist/frontend/server)
RUN npm run build

# Verificar que el build fue exitoso
RUN ls -la dist/frontend/

FROM node:22.19.0
WORKDIR /usr/app

# Copiar TODO el contenido de dist
COPY --from=build /usr/app/dist ./dist

# Copiar package.json
COPY --from=build /usr/app/package*.json ./

# Instalar solo deps de producción
RUN npm ci --omit=dev

# Verificar estructura
RUN ls -la dist/frontend/

# Ejecutar servidor
CMD ["node", "dist/frontend/server/server.mjs"]
EXPOSE 4000