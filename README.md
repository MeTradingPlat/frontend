# 📊 Trading Platform - Frontend

Una plataforma moderna y profesional para el análisis de mercados financieros con escáneres personalizados, filtros avanzados y alertas en tiempo real.

![Angular](https://img.shields.io/badge/Angular-19-red?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![Material](https://img.shields.io/badge/Material-Design-purple?style=flat-square&logo=material-design)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

## 🚀 Características Principales

### 🔍 Escáneres de Mercado
- **Configuración personalizada** de escáneres con múltiples parámetros
- **Filtros avanzados** basados en indicadores técnicos, volumen, precio y más
- **Gestión completa** de escáneres activos y archivados
- **Historial detallado** de señales, activos detectados y registros de actividad

### 📈 Filtros Inteligentes
- Filtros condicionales con operadores: Mayor que, Menor que, Entre, Fuera de rango
- Soporte para parámetros de tipo: Integer, Float, String y Condicional
- Organización por categorías para fácil navegación
- Configuración visual e intuitiva de parámetros

### 🔔 Monitoreo en Tiempo Real
- Detección automática de oportunidades de trading
- Sistema de inicio/detención de escáneres con indicadores visuales
- Visualización de señales con detalles de TP (Take Profit) y SL (Stop Loss)
- Seguimiento de activos y noticias relacionadas
- Notificaciones mediante snackbars para cambios de estado

### 📰 Noticias del Mercado
- Feed de noticias financieras actualizadas
- Sistema de filtrado y búsqueda avanzada
- Vista detallada de cada noticia

### 🎨 Interfaz Moderna
- Diseño profesional con Angular Material
- Tema claro y oscuro intercambiable con persistencia
- Soporte multiidioma (Español/Inglés) con cambio instantáneo usando @ngx-translate
- Diseño responsivo para todos los dispositivos
- Animaciones suaves y transiciones elegantes
- Spinner animados para indicar estado de escáneres activos
- Sistema de notificaciones no-intrusivo con snackbars

## 🛠️ Stack Tecnológico

### Core
- **Angular 19** - Framework principal
- **TypeScript 5.5** - Lenguaje de programación
- **RxJS 7.8** - Programación reactiva

### UI/UX
- **Angular Material 20** - Componentes de interfaz
- **Bootstrap Icons** - Iconografía
- **SCSS** - Estilos avanzados
- **@ngx-translate/core** - Sistema de traducción runtime

### Características Técnicas
- **Standalone Components** - Arquitectura moderna sin NgModules
- **Signals** - Sistema de reactividad de Angular con estado reactivo
- **Lazy Loading** - Carga diferida de módulos y tabs
- **OnPush Change Detection** - Optimización de rendimiento
- **Server-Side Rendering (SSR)** - Renderizado del lado del servidor con Express
- **i18n Runtime** - Internacionalización con @ngx-translate (sin recarga de página)
- **HTTP Interceptors** - Auto-inclusión de Accept-Language header
- **NotificationService** - Sistema centralizado de notificaciones

## 📦 Instalación

### Prerrequisitos
- Node.js 18.x o superior
- npm 9.x o superior
- Angular CLI 19.x

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd app/frontend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo de configuración si es necesario
cp src/environments/environment.example.ts src/environments/environment.ts
```

4. **Iniciar servidor de desarrollo**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm start                    # Servidor de desarrollo (puerto 4200)
npm run serve:ssr:frontend   # Servidor SSR de desarrollo

# Build
npm run build                # Build de producción
npm run build:dev           # Build de desarrollo

# Testing
npm test                     # Ejecutar tests unitarios
npm run test:coverage       # Tests con cobertura

# Linting
npm run lint                 # Verificar código
npm run lint:fix            # Corregir problemas automáticamente

# i18n
npm run extract-i18n        # Extraer textos para traducción
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                     # Servicios core y configuración global
│   │   ├── interceptors/         # HTTP interceptors
│   │   └── services/             # Servicios globales (theme, i18n)
│   ├── features/                 # Módulos de características
│   │   ├── home/                 # Página de inicio
│   │   ├── scanner/              # Gestión de escáneres
│   │   │   ├── components/       # Componentes de escáneres
│   │   │   ├── models/           # Interfaces y tipos
│   │   │   ├── pages/            # Páginas del módulo
│   │   │   └── services/         # Servicios del módulo
│   │   └── news/                 # Módulo de noticias
│   ├── shared/                   # Componentes y servicios compartidos
│   │   ├── components/
│   │   │   ├── layout/           # Navbar, header, etc.
│   │   │   └── ui/               # Componentes UI reutilizables
│   │   ├── models/               # Interfaces compartidas
│   │   └── services/             # Servicios compartidos
│   ├── app.config.ts             # Configuración de la aplicación
│   └── app.routes.ts             # Configuración de rutas
├── assets/                       # Recursos estáticos
│   └── i18n/                     # Archivos de traducción
├── environments/                 # Configuración de entornos
└── styles.scss                   # Estilos globales
```

## 🎯 Características por Módulo

### Home (Inicio)
- Hero section con call-to-action
- Showcase de funcionalidades principales
- Guía de "Cómo funciona"
- Estadísticas y beneficios
- Diseño moderno y profesional

### Scanner (Escáneres)
**Páginas:**
- Lista de escáneres activos con controles de inicio/detención
- Lista de escáneres archivados
- Configuración de escáneres
- Vista expandida (diálogo) con tabs:
  - Señales detectadas
  - Activos monitoreados
  - Noticias relacionadas
  - Registro de actividad
  - Filtros configurados

**Componentes principales:**
- Scanner cards con información resumida y spinner animado para estado "corriendo"
- Botones de inicio/detención con feedback visual
- Configuración de filtros con parámetros tipados
- Selección de mercados y horarios
- Sistema de tabs con lazy loading
- Diálogo expandido con funcionalidad completa (configurar, iniciar/detener)
- Notificaciones de éxito/error con snackbars

### News (Noticias)
- Tabla con filtrado y paginación
- Columnas: Fecha, Noticia, Detalles
- Vista detallada de cada noticia
- Búsqueda y filtrado avanzado

## 🌐 Internacionalización

La aplicación soporta múltiples idiomas usando **@ngx-translate/core** para traducciones en tiempo de ejecución (runtime).

**Idiomas disponibles:**
- 🇪🇸 Español (por defecto)
- 🇬🇧 Inglés

**Características del sistema i18n:**
- ✅ Cambio de idioma **sin recarga** de página
- ✅ Traducciones cargadas dinámicamente desde JSON
- ✅ Persistencia de preferencia en localStorage y cookies
- ✅ Header `Accept-Language` auto-incluido en peticiones HTTP
- ✅ Detección automática del idioma del navegador
- ✅ SSR compatible

**Archivos de traducción:**
```
src/app/assets/i18n/
├── es.json  # Traducciones en español
└── en.json  # Traducciones en inglés
```

**Agregar nuevas traducciones:**
1. Editar `src/app/assets/i18n/es.json` y `en.json`
2. Usar en templates: `{{ 'KEY.SUBKEY' | translate }}`
3. O en componentes: `this.translate.instant('KEY.SUBKEY')`

## 🎨 Temas

La aplicación incluye soporte para temas claro y oscuro.

**Cambiar tema:**
- Usar el botón en la barra lateral
- El tema se guarda en localStorage
- Cambio suave con transiciones CSS

## 📱 Responsive Design

La aplicación es completamente responsive y se adapta a:
- 💻 Desktop (1400px+)
- 💻 Laptop (1024px - 1399px)
- 📱 Tablet (768px - 1023px)
- 📱 Mobile (< 768px)

## 🔒 Mejores Prácticas Implementadas

### Código
- ✅ Standalone Components
- ✅ Signals para estado reactivo
- ✅ OnPush Change Detection Strategy
- ✅ Typed forms y modelos
- ✅ Facade pattern para servicios
- ✅ Separación de concerns

### Performance
- ✅ Lazy loading de módulos
- ✅ Lazy loading de tabs
- ✅ Tree shaking automático
- ✅ Optimización de imágenes
- ✅ Code splitting

### Accesibilidad
- ✅ Tooltips descriptivos
- ✅ ARIA labels
- ✅ Navegación por teclado
- ✅ Contraste adecuado de colores

## 🚀 Deployment

### Build de Producción
```bash
npm run build
```

Los archivos optimizados se generan en `dist/frontend/browser/`

### Variables de Entorno
Configurar según el entorno en:
- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

### SSR Deployment
```bash
# Build con SSR
npm run build

# Servir aplicación
npm run serve:ssr:frontend
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Estándares de código
- Seguir la guía de estilos de Angular
- Usar TypeScript estricto
- Documentar componentes y servicios complejos
- Escribir tests para nueva funcionalidad

## 📝 Convenciones de Nombres

### Archivos
- Componentes: `component-name.ts`, `component-name.html`, `component-name.scss`
- Servicios: `service-name.service.ts`
- Interfaces: `interface-name.interface.ts`
- Guards: `guard-name.guard.ts`

### Código
- Variables/funciones: `camelCase`
- Clases/Interfaces: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Archivos: `kebab-case`

## 🐛 Troubleshooting

### Error: Cannot find module
```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error de compilación de i18n
```bash
# Regenerar archivos de traducción
npm run extract-i18n
```

### Problemas con SSR
```bash
# Verificar que todos los componentes sean compatibles con SSR
# Evitar uso de window, document, localStorage directamente
# Usar isPlatformBrowser() cuando sea necesario
```

## 📚 Recursos

- [Documentación de Angular](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [RxJS](https://rxjs.dev)
- [TypeScript](https://www.typescriptlang.org)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Tu Nombre** - *Trabajo inicial* - [TuGitHub](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Equipo de Angular por el framework
- Comunidad de Angular Material
- Todos los contribuidores

---

⭐️ Si este proyecto te ha sido útil, considera darle una estrella en GitHub!
