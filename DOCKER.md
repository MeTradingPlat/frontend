# Docker Deployment Guide

## 📦 Contenido

Este proyecto incluye configuración Docker optimizada para producción con:

- ✅ Multi-stage build (reducir tamaño de imagen)
- ✅ Node.js 20 Alpine (imagen ligera)
- ✅ Usuario no-root (seguridad)
- ✅ Health checks configurados
- ✅ SSR con Express
- ✅ Soporte multi-idioma runtime (es/en) con @ngx-translate
- ✅ Optimización de capas Docker

## 🚀 Comandos Rápidos

### Usando Docker Compose (Recomendado)

```bash
# Build y start
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Reiniciar
docker-compose restart
```

### Usando Docker directamente

```bash
# Build la imagen
docker build -t metrading-frontend:latest .

# Run el contenedor
docker run -d \
  --name metrading-frontend \
  -p 4000:4000 \
  -e NODE_ENV=production \
  metrading-frontend:latest

# Ver logs
docker logs -f metrading-frontend

# Detener y eliminar
docker stop metrading-frontend
docker rm metrading-frontend
```

## 🔧 Configuración

### Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `4200` | Puerto donde se ejecuta el servidor |
| `NODE_ENV` | `production` | Modo de ejecución de Node.js |

### Personalizar puerto

**Docker Compose:**
```yaml
services:
  frontend:
    ports:
      - "8080:4000"  # Host:Container
    environment:
      - PORT=4000
```

**Docker CLI:**
```bash
docker run -d -p 8080:4000 -e PORT=4000 metrading-frontend:latest
```

## 📊 Health Check

El contenedor incluye health checks automáticos:

```bash
# Ver estado de salud
docker inspect --format='{{.State.Health.Status}}' metrading-frontend

# Ver logs de health check
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' metrading-frontend
```

Estados posibles:
- `starting` - Contenedor iniciando (primeros 5 segundos)
- `healthy` - Contenedor funcionando correctamente
- `unhealthy` - Contenedor con problemas (3 fallos consecutivos)

## 🏗️ Build Process

El Dockerfile usa multi-stage build:

### Stage 1: Builder
1. Instala todas las dependencias (dev + production)
2. Copia el código fuente
3. Ejecuta `npm run build` (compila ambos idiomas: es y en)

### Stage 2: Production
1. Copia solo los archivos compilados
2. Instala solo dependencias de producción
3. Configura usuario no-root
4. Expone puerto 4000
5. Configura health checks

### Tamaño de imagen

```bash
# Ver tamaño de la imagen
docker images metrading-frontend

# Aproximadamente:
# - Builder stage: ~1.2GB (solo durante build)
# - Production image: ~250-300MB (final)
```

## 🔐 Seguridad

### Usuario no-root

El contenedor ejecuta la aplicación como usuario `nodejs` (UID 1001):

```dockerfile
USER nodejs
```

### Best Practices implementadas

- ✅ Multi-stage build (reduce superficie de ataque)
- ✅ Usuario no-root
- ✅ Imagen Alpine (menos vulnerabilidades)
- ✅ Solo dependencias de producción
- ✅ Health checks
- ✅ dumb-init para manejar señales correctamente

## 🌐 Deployment en Producción

### Docker Compose con Nginx reverse proxy

```yaml
version: '3.8'

services:
  frontend:
    build: .
    expose:
      - "4000"
    environment:
      - NODE_ENV=production
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: metrading-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: metrading-frontend
  template:
    metadata:
      labels:
        app: metrading-frontend
    spec:
      containers:
      - name: frontend
        image: metrading-frontend:latest
        ports:
        - containerPort: 4000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "4000"
        livenessProbe:
          httpGet:
            path: /
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: metrading-frontend
spec:
  selector:
    app: metrading-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 4000
  type: LoadBalancer
```

## 🐛 Troubleshooting

### El contenedor no inicia

```bash
# Ver logs completos
docker logs metrading-frontend

# Verificar que el build fue exitoso
docker build -t metrading-frontend:latest . --progress=plain

# Entrar al contenedor para debugging
docker run -it --entrypoint /bin/sh metrading-frontend:latest
```

### Problemas de memoria

```bash
# Limitar memoria del contenedor
docker run -d --memory="512m" metrading-frontend:latest

# O en docker-compose.yml:
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### La app no responde en el puerto

```bash
# Verificar que el puerto está expuesto
docker port metrading-frontend

# Verificar logs del servidor
docker logs -f metrading-frontend

# Verificar que el proceso está corriendo
docker exec metrading-frontend ps aux
```

### Rebuild completo (limpiar caché)

```bash
# Docker
docker build --no-cache -t metrading-frontend:latest .

# Docker Compose
docker-compose build --no-cache
```

## 📝 CI/CD Integration

### GitHub Actions

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Build Docker image
      run: docker build -t metrading-frontend:${{ github.sha }} .

    - name: Test image
      run: |
        docker run -d --name test-container -p 4000:4000 metrading-frontend:${{ github.sha }}
        sleep 5
        curl -f http://localhost:4000 || exit 1
        docker stop test-container

    - name: Push to registry
      run: |
        echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
        docker tag metrading-frontend:${{ github.sha }} yourusername/metrading-frontend:latest
        docker push yourusername/metrading-frontend:latest
```

### GitLab CI

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t metrading-frontend:$CI_COMMIT_SHA .
    - docker save metrading-frontend:$CI_COMMIT_SHA > image.tar
  artifacts:
    paths:
      - image.tar

test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker load < image.tar
    - docker run -d --name test -p 4000:4000 metrading-frontend:$CI_COMMIT_SHA
    - sleep 5
    - apk add curl
    - curl -f http://localhost:4000 || exit 1

deploy:
  stage: deploy
  only:
    - main
  script:
    - docker load < image.tar
    - docker tag metrading-frontend:$CI_COMMIT_SHA registry.example.com/metrading-frontend:latest
    - docker push registry.example.com/metrading-frontend:latest
```

## 🔄 Actualizar la Aplicación

```bash
# 1. Pull los últimos cambios
git pull

# 2. Rebuild y restart
docker-compose up -d --build

# 3. Verificar que está funcionando
docker-compose ps
docker-compose logs -f
```

## 📚 Recursos Adicionales

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Angular SSR Deployment](https://angular.dev/guide/ssr)
