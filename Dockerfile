# Stage 1: Build the Angular application
FROM node:22.19.0 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build --configuration production

# Stage 2: Run the production server
FROM node:22.19.0 AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist/frontend /app/dist/frontend
EXPOSE 4200
CMD ["node", "dist/frontend/server/server.mjs"]