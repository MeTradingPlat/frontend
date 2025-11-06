# HTTP Interceptors - Documentación

## Language Interceptor

### 📋 Descripción

El `languageInterceptor` añade automáticamente el header `Accept-Language` a todas las peticiones HTTP que salgan de la aplicación Angular hacia el backend.

### 🎯 Propósito

Permitir que el backend identifique el idioma preferido del usuario y devuelva respuestas localizadas en el idioma correcto (español o inglés).

### 🔧 Funcionamiento

1. **Intercepta** todas las peticiones HTTP salientes
2. **Lee** el idioma actual del `I18nService`
3. **Añade** el header `Accept-Language` con el código de idioma (`es` o `en`)
4. **Envía** la petición con el header incluido

### 📡 Headers Enviados

**Cuando el usuario tiene español:**
```http
GET /api/scanners HTTP/1.1
Host: api.example.com
Accept-Language: es
```

**Cuando el usuario tiene inglés:**
```http
GET /api/scanners HTTP/1.1
Host: api.example.com
Accept-Language: en
```

### 💻 Implementación Backend

Tu backend debe estar preparado para leer este header y devolver las respuestas en el idioma correcto.

#### Ejemplo en Spring Boot (Java):

```java
@RestController
@RequestMapping("/api/scanners")
public class ScannerController {

    @GetMapping
    public ResponseEntity<List<Scanner>> getScanners(
        @RequestHeader(value = "Accept-Language", defaultValue = "es") String language
    ) {
        // Usar el language para devolver datos localizados
        List<Scanner> scanners = scannerService.findAll(language);
        return ResponseEntity.ok(scanners);
    }
}
```

#### Ejemplo en Node.js/Express:

```javascript
app.get('/api/scanners', (req, res) => {
  const language = req.headers['accept-language'] || 'es';

  // Usar el language para devolver datos localizados
  const scanners = getScanners(language);
  res.json(scanners);
});
```

#### Ejemplo en .NET:

```csharp
[ApiController]
[Route("api/[controller]")]
public class ScannersController : ControllerBase
{
    [HttpGet]
    public IActionResult GetScanners([FromHeader(Name = "Accept-Language")] string language = "es")
    {
        // Usar el language para devolver datos localizados
        var scanners = _scannerService.GetAll(language);
        return Ok(scanners);
    }
}
```

### 🎨 Respuestas Localizadas del Backend

El backend puede devolver diferentes valores según el idioma:

**Respuesta en español (Accept-Language: es):**
```json
{
  "mensaje": "Escáner creado exitosamente",
  "scanner": {
    "nombre": "Mi Escáner",
    "estado": "Activo"
  }
}
```

**Respuesta en inglés (Accept-Language: en):**
```json
{
  "mensaje": "Scanner created successfully",
  "scanner": {
    "nombre": "My Scanner",
    "estado": "Active"
  }
}
```

### 🔄 Flujo Completo

```
Usuario cambia idioma a inglés
        ↓
I18nService actualiza idioma a 'en'
        ↓
Usuario hace petición HTTP
        ↓
LanguageInterceptor intercepta petición
        ↓
Añade header: Accept-Language: en
        ↓
Backend recibe petición con header
        ↓
Backend devuelve respuesta en inglés
        ↓
Angular muestra datos en inglés
```

### ⚙️ Configuración

El interceptor está configurado en `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { languageInterceptor } from './core/interceptors/language.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([languageInterceptor])
    )
  ]
};
```

### 🧪 Testing

Puedes verificar que el interceptor funciona correctamente:

1. **Abre las DevTools del navegador** (F12)
2. **Ve a la pestaña Network**
3. **Haz una petición HTTP** (navega por la app)
4. **Inspecciona los Request Headers**
5. **Verifica** que aparece `Accept-Language: es` o `Accept-Language: en`

### 📝 Notas Importantes

- ✅ El interceptor se aplica **automáticamente** a todas las peticiones HTTP
- ✅ No necesitas añadir el header manualmente en tus servicios
- ✅ El header se actualiza automáticamente cuando el usuario cambia de idioma
- ✅ Es **SSR-safe**: funciona correctamente en servidor y navegador
- ⚠️ Asegúrate de que tu backend esté preparado para leer este header
- ⚠️ El backend debe tener un idioma por defecto (recomendado: español)

### 🔍 Debugging

Si necesitas verificar qué idioma se está enviando:

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '@core/services/i18n/i18n.service';

@Component({
  selector: 'app-debug',
  template: ''
})
export class DebugComponent {
  private http = inject(HttpClient);
  private i18n = inject(I18nService);

  testRequest() {
    console.log('Current locale:', this.i18n.currentLocale());
    console.log('Accept-Language header will be:', this.i18n.getAcceptLanguageHeader());

    this.http.get('/api/test').subscribe(response => {
      console.log('Response:', response);
    });
  }
}
```

### 🚀 Ejemplo Completo de Integración

**Frontend (Angular):**
```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-scanners',
  template: `
    <div *ngFor="let scanner of scanners()">
      <h3>{{ scanner.nombre }}</h3>
      <p>{{ scanner.estado }}</p>
    </div>
  `
})
export class ScannersComponent {
  private http = inject(HttpClient);
  scanners = signal<Scanner[]>([]);

  ngOnInit() {
    // El header Accept-Language se añade automáticamente
    this.http.get<Scanner[]>('/api/scanners')
      .subscribe(data => this.scanners.set(data));
  }
}
```

**Backend (Spring Boot):**
```java
@RestController
@RequestMapping("/api/scanners")
public class ScannerController {

    @Autowired
    private ScannerService scannerService;

    @GetMapping
    public ResponseEntity<List<ScannerDTO>> getScanners(
        @RequestHeader(value = "Accept-Language", defaultValue = "es") String language
    ) {
        List<ScannerDTO> scanners = scannerService.findAllLocalized(language);
        return ResponseEntity.ok(scanners);
    }
}
```

### 📚 Referencias

- [MDN - Accept-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)
- [Angular HTTP Interceptors](https://angular.dev/guide/http/interceptors)
- [RFC 7231 - Accept-Language](https://tools.ietf.org/html/rfc7231#section-5.3.5)
