FROM node:22.19.0 AS dev
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache for npm install
COPY package.json package-lock.json ./

# Remove node_modules and .angular/cache from any previous layers before installing dependencies
RUN rm -rf node_modules .angular/cache

# Install dependencies, including Angular CLI globally
RUN npm install -g @angular/cli
RUN npm install

# Copy the rest of the application code
COPY . .

# Aggressively clear Angular cache and Vite's optimized dependencies to prevent stale pre-bundle issues
# Removed --force flag as it caused an "Unknown argument" error.
RUN ng cache clean && rm -rf .angular/cache node_modules/.vite

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