# Servicios Core - Documentación

## 📚 Índice

1. [ThemeService](#themeservice) - Gestión de temas (claro/oscuro)
2. [I18nService](#i18nservice) - Gestión de idiomas
3. [StorageService](#storageservice) - Persistencia en localStorage

---

## ThemeService

Servicio para gestionar el tema de la aplicación (claro/oscuro) con persistencia y detección de preferencias del sistema.

### Características

✅ **Estado reactivo** con signals
✅ **Persistencia** en localStorage
✅ **SSR-safe** (funciona en servidor y navegador)
✅ **Detección automática** de preferencias del sistema
✅ **Aplicación automática** de clases CSS

### Uso Básico

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme/theme.service';

@Component({
  selector: 'app-my-component',
  template: `
    <button (click)="toggleTheme()">
      @if (isDark()) {
        <span>Cambiar a claro</span>
      } @else {
        <span>Cambiar a oscuro</span>
      }
    </button>

    <p>Tema actual: {{ currentTheme() }}</p>
  `
})
export class MyComponent {
  private themeService = inject(ThemeService);

  // Signals readonly
  currentTheme = this.themeService.theme;
  isDark = this.themeService.isDark;
  isLight = this.themeService.isLight;

  toggleTheme() {
    this.themeService.toggle();
  }

  setDarkTheme() {
    this.themeService.setTheme('dark');
  }

  useSystemPreference() {
    this.themeService.useSystemPreference();
  }
}
```

### API

#### Signals (readonly)

- `theme: Signal<'light' | 'dark'>` - Tema actual
- `isDark: Signal<boolean>` - Si el tema es oscuro
- `isLight: Signal<boolean>` - Si el tema es claro

#### Métodos

- `setTheme(theme: 'light' | 'dark'): void` - Establece un tema específico
- `toggle(): void` - Alterna entre claro y oscuro
- `useSystemPreference(): void` - Usa la preferencia del sistema
- `reset(): void` - Resetea al tema por defecto

### Clases CSS aplicadas

El servicio aplica automáticamente estas clases al `<body>`:

- `dark-mode` - Cuando el tema es oscuro
- `light-mode` - Cuando el tema es claro
- Atributo `data-theme="dark|light"` - Para selectores CSS

Ejemplo de uso en CSS:

```css
/* Usando clases */
.dark-mode {
  --background: #1a1a1a;
  --text: #ffffff;
}

.light-mode {
  --background: #ffffff;
  --text: #000000;
}

/* Usando atributo data-theme */
[data-theme="dark"] {
  --primary: #90caf9;
}

[data-theme="light"] {
  --primary: #1976d2;
}
```

---

## I18nService

Servicio para gestionar la internacionalización (i18n) de la aplicación con soporte para múltiples idiomas.

### Características

✅ **Estado reactivo** con signals
✅ **Persistencia** en localStorage
✅ **SSR-safe** (funciona en servidor y navegador)
✅ **Detección automática** del idioma del navegador
✅ **Recarga automática** al cambiar idioma

### Idiomas Soportados

- 🇪🇸 Español (`es`)
- 🇺🇸 English (`en`)

### Uso Básico

```typescript
import { Component, inject } from '@angular/core';
import { I18nService } from '@core/services/i18n/i18n.service';

@Component({
  selector: 'app-my-component',
  template: `
    <button (click)="toggleLanguage()">
      {{ currentLocaleInfo().flag }} {{ currentLocaleInfo().name }}
    </button>

    <p>Idioma: {{ currentLocale() }}</p>

    <!-- Lista de idiomas disponibles -->
    <select (change)="changeLanguage($event)">
      @for (locale of availableLocales(); track locale.code) {
        <option [value]="locale.code">
          {{ locale.flag }} {{ locale.name }}
        </option>
      }
    </select>
  `
})
export class MyComponent {
  private i18nService = inject(I18nService);

  // Signals readonly
  currentLocale = this.i18nService.currentLocale;
  currentLocaleInfo = this.i18nService.currentLocaleInfo;
  availableLocales = this.i18nService.availableLocales;
  isSpanish = this.i18nService.isSpanish;
  isEnglish = this.i18nService.isEnglish;

  toggleLanguage() {
    this.i18nService.toggle();
  }

  changeLanguage(event: Event) {
    const select = event.target as HTMLSelectElement;
    const locale = select.value as 'es' | 'en';
    this.i18nService.setLocale(locale);
  }

  useBrowserLanguage() {
    this.i18nService.useBrowserPreference();
  }
}
```

### API

#### Signals (readonly)

- `currentLocale: Signal<'es' | 'en'>` - Código del idioma actual
- `currentLocaleInfo: Signal<LocaleInfo>` - Información completa del idioma actual
- `availableLocales: Signal<LocaleInfo[]>` - Lista de idiomas disponibles
- `isSpanish: Signal<boolean>` - Si el idioma es español
- `isEnglish: Signal<boolean>` - Si el idioma es inglés

#### Métodos

- `setLocale(locale: 'es' | 'en'): void` - Cambia el idioma (recarga la página)
- `toggle(): void` - Alterna entre español e inglés
- `useBrowserPreference(): void` - Usa el idioma del navegador
- `reset(): void` - Resetea al idioma por defecto (español)

### Importante: Cambio de Idioma

⚠️ **El cambio de idioma recarga la página automáticamente**. Esto es necesario porque Angular i18n requiere recompilar la aplicación con las traducciones del nuevo idioma.

Si necesitas comportamiento diferente (sin recarga), puedes modificar el método `reloadWithNewLocale()` en el servicio.

### HTTP Interceptor - Accept-Language Header

📡 **Todas las peticiones HTTP incluyen automáticamente el header `Accept-Language`** con el idioma actual del usuario.

Esto permite que tu backend devuelva respuestas en el idioma correcto. El interceptor está configurado automáticamente en `app.config.ts`.

**Ejemplo de header enviado:**
```
Accept-Language: es
```
o
```
Accept-Language: en
```

**Peticiones manuales con HttpClient:**
```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-example',
  template: ''
})
export class ExampleComponent {
  private http = inject(HttpClient);

  fetchData() {
    // El header Accept-Language se añade automáticamente
    this.http.get('/api/data').subscribe(data => {
      console.log(data); // Respuesta en el idioma del usuario
    });
  }
}
```

**Configuración del interceptor** (ya incluido en `app.config.ts`):
```typescript
import { languageInterceptor } from './core/interceptors/language.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([languageInterceptor])
    )
  ]
};
```

---

## StorageService

Servicio para gestionar el almacenamiento local (localStorage) de forma segura y tipada.

### Características

✅ **Tipado genérico** con TypeScript
✅ **SSR-safe** (no falla en servidor)
✅ **Manejo de errores** automático
✅ **Serialización/Deserialización** JSON automática

### Uso Básico

```typescript
import { Component, inject } from '@angular/core';
import { StorageService } from '@core/services/storage.service';

interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

@Component({
  selector: 'app-my-component',
  template: `<button (click)="savePreferences()">Guardar</button>`
})
export class MyComponent {
  private storage = inject(StorageService);

  savePreferences() {
    const prefs: UserPreferences = {
      theme: 'dark',
      language: 'es',
      notifications: true
    };

    // Guardar con tipado
    this.storage.setItem<UserPreferences>('user-prefs', prefs);
  }

  loadPreferences() {
    // Cargar con tipado
    const prefs = this.storage.getItem<UserPreferences>('user-prefs');

    if (prefs) {
      console.log('Theme:', prefs.theme);
      console.log('Language:', prefs.language);
    }
  }

  removePreferences() {
    this.storage.removeItem('user-prefs');
  }

  clearAll() {
    this.storage.clear();
  }
}
```

### API

- `setItem<T>(key: string, value: T): void` - Guarda un valor
- `getItem<T>(key: string): T | null` - Obtiene un valor
- `removeItem(key: string): void` - Elimina un valor
- `clear(): void` - Limpia todo el localStorage

---

## Ejemplos de Integración

### Ejemplo 1: Navbar con Tema e Idioma

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme/theme.service';
import { I18nService } from '@core/services/i18n/i18n.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav>
      <!-- Botón de tema -->
      <button (click)="themeService.toggle()">
        @if (themeService.isDark()) {
          <i class="bi bi-sun-fill"></i>
          <span i18n>Claro</span>
        } @else {
          <i class="bi bi-moon-fill"></i>
          <span i18n>Oscuro</span>
        }
      </button>

      <!-- Botón de idioma -->
      <button (click)="i18nService.toggle()">
        <i class="bi bi-translate"></i>
        <span>{{ i18nService.currentLocaleInfo().name }}</span>
      </button>
    </nav>
  `
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);
  readonly i18nService = inject(I18nService);
}
```

### Ejemplo 2: Settings Page

```typescript
import { Component, inject } from '@angular/core';
import { ThemeService } from '@core/services/theme/theme.service';
import { I18nService } from '@core/services/i18n/i18n.service';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings">
      <h2 i18n>Configuración</h2>

      <!-- Selector de Tema -->
      <section>
        <h3 i18n>Apariencia</h3>
        <select [value]="themeService.theme()" (change)="onThemeChange($event)">
          <option value="light" i18n>Claro</option>
          <option value="dark" i18n>Oscuro</option>
        </select>
        <button (click)="themeService.useSystemPreference()" i18n>
          Usar preferencia del sistema
        </button>
      </section>

      <!-- Selector de Idioma -->
      <section>
        <h3 i18n>Idioma</h3>
        @for (locale of i18nService.availableLocales(); track locale.code) {
          <button
            (click)="i18nService.setLocale(locale.code)"
            [class.active]="locale.code === i18nService.currentLocale()"
          >
            {{ locale.flag }} {{ locale.name }}
          </button>
        }
      </section>

      <!-- Resetear -->
      <button (click)="resetAll()" i18n>Restablecer valores por defecto</button>
    </div>
  `
})
export class SettingsComponent {
  readonly themeService = inject(ThemeService);
  readonly i18nService = inject(I18nService);

  onThemeChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.themeService.setTheme(select.value as 'light' | 'dark');
  }

  resetAll() {
    this.themeService.reset();
    this.i18nService.reset();
  }
}
```

---

## Configuración de Angular i18n

### 🔍 ¿Cómo funcionan los archivos xlf con el I18nService?

Es importante entender que hay **dos partes** en el sistema de idiomas:

#### 1. **Archivos xlf (Compilación)** - Build-time
Los archivos `.xlf` son usados por Angular **durante la compilación** para generar versiones separadas de tu aplicación:
- `messages.xlf` - Idioma fuente (español)
- `messages.en.xlf` - Traducciones al inglés

Angular lee estos archivos y **reemplaza** todas las etiquetas `i18n` en tus templates con el texto correcto **antes** de generar el JavaScript final.

#### 2. **I18nService (Ejecución)** - Runtime
El `I18nService` trabaja **durante la ejecución** de la aplicación y:
- Detecta qué idioma prefiere el usuario
- Guarda la preferencia en localStorage
- Recarga la página para cargar la versión compilada correcta
- Envía el header `Accept-Language` en peticiones HTTP

### 🔄 Flujo completo:

```
1. Usuario hace clic en botón de idioma
        ↓
2. I18nService guarda preferencia ('en') en localStorage
        ↓
3. I18nService recarga la página
        ↓
4. Angular detecta la preferencia guardada
        ↓
5. Angular carga la versión pre-compilada en inglés
   (generada con messages.en.xlf)
        ↓
6. La app se muestra completamente en inglés
        ↓
7. Todas las peticiones HTTP incluyen: Accept-Language: en
```

### ✅ Configuración actual

Tu proyecto **ya está configurado** correctamente en `angular.json`:

```json
{
  "i18n": {
    "sourceLocale": "es",
    "locales": {
      "en": {
        "translation": "src/app/assets/i18n/messages.en.xlf"
      }
    }
  }
}
```

### 📝 Archivos de traducción

**Ya creados:**
- ✅ `src/app/assets/i18n/messages.xlf` - Español (idioma fuente)
- ✅ `src/app/assets/i18n/messages.en.xlf` - Inglés (traducción)

### 🛠️ Comandos de Build

Para generar las versiones en diferentes idiomas:

```bash
# Desarrollo en español (por defecto)
npm run start

# Desarrollo en inglés
ng serve --configuration=development --localize

# Build de producción (genera ambas versiones)
ng build --configuration=production --localize

# Build solo español
ng build --configuration=production --localize=es

# Build solo inglés
ng build --configuration=production --localize=en
```

### 📦 Output después del build

Cuando ejecutas `ng build --localize`, Angular genera:

```
dist/
├── es/               # Versión española
│   ├── index.html
│   ├── main.js
│   └── ...
└── en/               # Versión inglesa
    ├── index.html
    ├── main.js
    └── ...
```

### 🚀 Deployment

En producción, necesitas configurar tu servidor para servir la versión correcta según el idioma guardado en localStorage:

#### Opción 1: Rutas localizadas (Recomendado)
```
https://tuapp.com/es/  → Sirve dist/es/
https://tuapp.com/en/  → Sirve dist/en/
```

El `I18nService` puede redirigir automáticamente a la ruta correcta. Descomenta las líneas en `reloadWithNewLocale()`:

```typescript
private reloadWithNewLocale(locale: SupportedLocale): void {
  if (!this.isBrowser) return;

  const currentPath = this.router.url;
  const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, '');
  const newPath = `/${locale}${pathWithoutLocale}`;
  window.location.href = newPath;
}
```

#### Opción 2: Detección por localStorage
Tu servidor lee el localStorage del navegador y sirve la versión correcta (requiere SSR).

### 🔄 Actualizar traducciones

Cuando añades nuevas etiquetas `i18n` en templates:

```bash
# 1. Extraer nuevas traducciones
ng extract-i18n --output-path src/app/assets/i18n

# 2. Editar messages.en.xlf manualmente con las nuevas traducciones

# 3. Build para verificar
ng build --localize
```

### 📚 Ejemplo de uso en templates

```html
<!-- Simple -->
<h1 i18n>Bienvenido</h1>

<!-- Con descripción (ayuda al traductor) -->
<button i18n="Botón para guardar cambios">Guardar</button>

<!-- Con ID único (previene cambios accidentales) -->
<p i18n="@@welcomeMessage">Hola, usuario</p>

<!-- Interpolación -->
<span i18n>Hola, {{userName}}</span>

<!-- Atributos -->
<img [src]="logo" i18n-alt alt="Logo de la empresa" />

<!-- Plurales -->
<span i18n>{count, plural, =0 {No items} =1 {One item} other {{{count}} items}}</span>
```

---

## Notas Importantes

### Persistencia

- Ambos servicios (Theme e I18n) guardan las preferencias del usuario en `localStorage`
- Las preferencias persisten entre sesiones y recargas
- Son SSR-safe: no fallan cuando se ejecutan en el servidor

### Signals

- Todos los estados son signals **readonly**
- Los componentes se reactualizan automáticamente cuando cambian
- Compatible con `OnPush` change detection

### Performance

- Los servicios son **singleton** (`providedIn: 'root'`)
- Se cargan una sola vez en toda la aplicación
- Usan `inject()` en lugar de constructor injection (más moderno)

---

## Soporte

Si tienes dudas o problemas, revisa:
1. Los ejemplos en este README
2. El código fuente de los servicios (están bien documentados)
3. Los comentarios JSDoc en cada método
