# 🚨 Importante: Desarrollo con i18n

## ❌ El Problema

**En modo desarrollo (`npm run start`), el cambio de idioma NO funciona.**

¿Por qué? Porque Angular i18n es un sistema de **compilación** (build-time), NO de ejecución (runtime).

## 🔍 Cómo funciona Angular i18n

### En Desarrollo (ng serve):
```
ng serve
  └─ Sirve la app SIN compilar traducciones
  └─ Solo muestra el idioma fuente (español)
  └─ El botón de idioma recarga pero sigue en español
```

### En Producción (ng build):
```
ng build --localize
  └─ Compila DOS versiones COMPLETAS:
      ├─ dist/es/  (español)
      └─ dist/en/  (inglés)
  └─ El servidor sirve la versión correcta según localStorage
```

## ✅ Soluciones para Desarrollo

### Opción 1: Desarrollar solo en español (Recomendado)
```bash
npm run start
```
- Más rápido
- Solo para desarrollo de features
- El idioma NO cambiará al hacer clic

### Opción 2: Desarrollar y probar inglés
```bash
npm run start:en
```
- Compila con traducciones al inglés
- Más lento (compila traducciones)
- Puedes ver cómo se ve en inglés

### Opción 3: Probar sistema completo de idiomas
```bash
# 1. Compilar producción con ambos idiomas
npm run build

# 2. Servir la versión compilada
npm run serve:ssr:frontend

# 3. Abrir http://localhost:4000
# 4. Ahora el cambio de idioma SÍ funciona
```

## 🎯 Flujo de Trabajo Recomendado

### Durante el desarrollo:
```bash
# Desarrolla en español (más rápido)
npm run start

# Si necesitas ver traducciones en inglés:
npm run start:en
```

### Antes de commit/deploy:
```bash
# Compila y prueba ambos idiomas
npm run build
npm run serve:ssr:frontend

# Verifica que:
# 1. El botón de idioma funciona
# 2. Las traducciones son correctas
# 3. El localStorage persiste la preferencia
```

## 📝 Comandos Útiles

```bash
# Desarrollo español (por defecto)
npm run start

# Desarrollo inglés (con traducciones)
npm run start:en

# Build completo (ambos idiomas)
npm run build

# Build solo español
npm run build:es

# Build solo inglés
npm run build:en

# Extraer nuevas traducciones
npm run extract-i18n

# Servir versión compilada
npm run serve:ssr:frontend
```

## 🧪 Cómo Probar el Sistema de Idiomas

### Paso 1: Compilar
```bash
npm run build
```

### Paso 2: Verificar output
```bash
ls dist/
# Deberías ver:
#   es/
#   en/
```

### Paso 3: Servir
```bash
npm run serve:ssr:frontend
```

### Paso 4: Probar en navegador
1. Abre http://localhost:4000
2. Abre DevTools (F12)
3. Ve a Application → Local Storage
4. Verifica que existe `app_locale` con valor `es`
5. Haz clic en botón de idioma
6. La página se recarga
7. Verifica que `app_locale` cambió a `en`
8. La app debe estar en inglés

## ⚠️ Errores Comunes

### "El botón no hace nada en desarrollo"
**Normal.** En desarrollo con `ng serve`, las traducciones NO se compilan.

**Solución:** Usa `npm run build` + `npm run serve:ssr:frontend` para probar.

### "La página se recarga pero sigue en español"
Si esto pasa en producción (después de `npm run build`):

1. Verifica que `dist/` tiene carpetas `es/` y `en/`
2. Verifica que tu servidor sirve la carpeta correcta según la ruta
3. Verifica que localStorage guarda correctamente el idioma

### "Las traducciones no aparecen"
1. Verifica que `messages.en.xlf` tiene todas las traducciones
2. Ejecuta `npm run extract-i18n` para actualizar
3. Recompila con `npm run build`

## 🚀 Deployment

En producción, tu servidor debe:

### Opción 1: Rutas localizadas
```
https://tuapp.com/es/   → Sirve dist/es/
https://tuapp.com/en/   → Sirve dist/en/
```

Descomenta en `i18n.service.ts`:
```typescript
private reloadWithNewLocale(locale: SupportedLocale): void {
  const currentPath = this.router.url;
  const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, '');
  const newPath = `/${locale}${pathWithoutLocale}`;
  window.location.href = newPath;
}
```

### Opción 2: Dominio único con detección
```
https://tuapp.com → Lee localStorage
                  ├─ 'es' → Sirve dist/es/
                  └─ 'en' → Sirve dist/en/
```

Esto requiere configuración en tu servidor (Express, Nginx, etc).

## 💡 Resumen

| Comando | Velocidad | Traducciones | Uso |
|---------|-----------|--------------|-----|
| `npm run start` | ⚡ Rápido | ❌ No | Desarrollo diario |
| `npm run start:en` | 🐌 Lento | ✅ Sí (inglés) | Ver traducciones |
| `npm run build` | 🏗️ Build | ✅ Sí (ambos) | Antes de deploy |
| `npm run serve:ssr:frontend` | 🚀 Prod | ✅ Sí (ambos) | Probar sistema completo |

## 📚 Más Información

- [Angular i18n Docs](https://angular.dev/guide/i18n)
- Ver: `src/app/core/services/README.md`
- Ver: `src/app/core/services/i18n/I18N_EXPLICACION.md`
