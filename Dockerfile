FROM node:22.19.0 AS dev
WORKDIR /app
COPY . .
RUN npm install -g @angular/cli
RUN npm install
EXPOSE 4200
CMD ["ng", "serve", "--host", "0.0.0.0"]

# # Etapa de build
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY . .
# RUN npm install -g @angular/cli
# RUN npm install
# RUN ng build --configuration production

# # Etapa de runtime
# FROM node:20-alpine AS runtime
# WORKDIR /app
# RUN npm install -g http-server
# COPY --from=build /app/dist /app/dist
# EXPOSE 4000
# CMD ["http-server", "dist", "-p", "4000"]