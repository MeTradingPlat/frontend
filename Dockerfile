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

# Build (Angular creará .angular/ automáticamente)
RUN npm run build

FROM node:22.19.0
WORKDIR /usr/app

# Copiar solo lo necesario para producción
COPY --from=build /usr/app/dist/frontend ./dist/frontend
COPY --from=build /usr/app/package*.json ./

# Instalar solo deps de producción
RUN npm ci --omit=dev

# Ejecutar servidor
CMD ["node", "dist/frontend/server/server.mjs"]
EXPOSE 4000