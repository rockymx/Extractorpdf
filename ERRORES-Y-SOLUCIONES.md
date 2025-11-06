# Registro de Errores y Soluciones

Este documento registra los errores encontrados durante el desarrollo y sus soluciones para referencia futura.

---

## Error 1: PDF.js - Failed to load resource: net::ERR_BLOCKED_BY_CLIENT

### Descripción del Error
Al intentar cargar PDF.js desde CDN externo (unpkg.com o cdnjs.com), el navegador bloqueaba la solicitud mostrando:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
```

### Causa
Los recursos externos de CDN estaban siendo bloqueados por extensiones del navegador (bloqueadores de anuncios, bloqueadores de scripts) o políticas de seguridad de red.

### Solución
Instalar PDF.js como dependencia local del proyecto:

```bash
npm install pdfjs-dist
```

Luego importar directamente en el código:

```typescript
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

**Archivo afectado:** `utils/fileUtils.ts`

---

## Error 2: Tailwind CSS - Failed to load resource: net::ERR_BLOCKED_BY_CLIENT

### Descripción del Error
Similar al error de PDF.js, Tailwind CSS cargado desde CDN era bloqueado:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
https://cdn.tailwindcss.com
```

### Causa
El CDN de Tailwind CSS estaba siendo bloqueado por extensiones del navegador o políticas de seguridad, dejando la aplicación sin estilos.

### Solución

#### Paso 1: Instalar Tailwind CSS v4 localmente
```bash
npm install -D tailwindcss @tailwindcss/postcss autoprefixer
```

#### Paso 2: Configurar PostCSS
Crear/actualizar `postcss.config.js`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

#### Paso 3: Actualizar archivo CSS
Cambiar en `index.css`:
```css
/* Antes (v3) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Después (v4) */
@import "tailwindcss";
```

#### Paso 4: Importar CSS en la aplicación
En `index.tsx`:
```typescript
import './index.css';
```

#### Paso 5: Limpiar HTML
Remover el script de CDN de `index.html`:
```html
<!-- REMOVER ESTO -->
<script src="https://cdn.tailwindcss.com"></script>
```

**Archivos afectados:**
- `index.html`
- `index.tsx`
- `index.css`
- `postcss.config.js`
- `package.json`

---

## Error 3: Google Fonts - Failed to load resource: net::ERR_BLOCKED_BY_CLIENT

### Descripción del Error
Las fuentes de Google Fonts también pueden ser bloqueadas:
```
Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
https://fonts.googleapis.com/...
```

### Causa
Similar a los casos anteriores, los CDNs externos son bloqueados.

### Solución Preventiva
Si se necesitan fuentes personalizadas:

1. **Opción 1:** Usar fuentes del sistema (font-family stack)
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

2. **Opción 2:** Descargar fuentes y servirlas localmente
- Descargar archivos de fuentes
- Colocarlos en `/public/fonts/`
- Definir @font-face en CSS

---

## Patrón General de Solución

### Problema Común
Los recursos externos (CDN) son bloqueados por:
- Extensiones de navegador (AdBlock, uBlock Origin, Privacy Badger)
- Políticas de seguridad corporativas
- Configuraciones de firewall
- Content Security Policy (CSP) restrictivas

### Mejor Práctica
**SIEMPRE instalar dependencias localmente en lugar de usar CDNs externos:**

✅ **Correcto:**
```bash
npm install nombre-paquete
```

❌ **Evitar:**
```html
<script src="https://cdn.ejemplo.com/libreria.js"></script>
```

### Beneficios de Dependencias Locales
1. **Confiabilidad:** No depende de servicios externos
2. **Seguridad:** Control total sobre versiones y código
3. **Performance:** Bundling optimizado con Vite
4. **Offline:** Funciona sin conexión a internet
5. **Compatibilidad:** No afectado por bloqueadores

---

## Comandos Útiles para Diagnóstico

### Verificar construcción del proyecto
```bash
npm run build
```

### Verificar dependencias instaladas
```bash
npm list
```

### Limpiar caché y reinstalar
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Notas Importantes

- **Vite** bundlea automáticamente todas las dependencias locales
- Usar `import` en lugar de `<script>` tags para recursos externos
- Mantener `package.json` actualizado con todas las dependencias
- Probar en diferentes navegadores y con/sin extensiones

---

**Última actualización:** 2025-11-06
