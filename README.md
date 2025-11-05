
# PDF Data Extractor Pro

Esta aplicación web permite a los usuarios cargar archivos PDF que contienen informes de consultas médicas y, utilizando la IA de Google Gemini, extraer datos tabulares de pacientes de forma estructurada. Los datos extraídos se pueden exportar a un archivo Excel (.xlsx) o visualizar directamente en la aplicación.

El proyecto está diseñado para funcionar de manera nativa en entornos de desarrollo web sin `build` como **bolt.new**.

---

## 🚀 Cómo Empezar en bolt.new

Este proyecto está listo para ejecutarse directamente en `bolt.new`. Sin embargo, para que la funcionalidad principal de extracción con IA funcione, es **esencial** configurar tu clave de API de Google Gemini.

### Paso Crítico: Configurar la API Key

La aplicación necesita acceso a la API de Google Gemini para analizar los PDFs. Debes proporcionar tu propia clave.

1.  **Obtén tu API Key:** Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) y crea una nueva clave de API si aún no tienes una.

2.  **Abre los "Secrets" en bolt.new:** En la interfaz de `bolt.new`, busca y abre el panel de "Secrets" (Secretos).

3.  **Crea un nuevo Secret:**
    *   **Name (Nombre):** `API_KEY`
    *   **Value (Valor):** Pega aquí la clave de API que obtuviste de Google AI Studio.



> **Importante:** La aplicación no funcionará sin este paso. Si encuentras errores relacionados con la autenticación o la API, verifica que el `Secret` se haya creado correctamente.

---

## 📖 Cómo Usar la Aplicación

El flujo de trabajo es simple e intuitivo:

1.  **Pantalla de Bienvenida:** Al iniciar, se te presentarán dos opciones:
    *   **Exportar a Excel:** Extrae los datos y prepáralos para descargar como un archivo `.xlsx`.
    *   **Ver en la App:** Extrae y muestra los datos en una tabla interactiva dentro de la aplicación.
2.  **Cargar Archivo:** Una vez que elijas un flujo de trabajo, aparecerá una zona para arrastrar y soltar o seleccionar tu archivo PDF.
3.  **Procesamiento con IA:** La aplicación leerá el texto del PDF y lo enviará a la API de Gemini para su análisis y estructuración. Un indicador de carga mostrará el progreso.
4.  **Visualizar y Exportar:** Después del procesamiento, verás los detalles del informe y una tabla con los registros de los pacientes. Si elegiste el flujo "Exportar a Excel", un botón de descarga estará disponible.
5.  **Historial y Configuración:** Usa el menú de la esquina superior derecha para acceder al historial de extracciones anteriores o para configurar la visibilidad de las columnas en la tabla.

---

## 📁 Estructura del Proyecto

El código está organizado de manera modular para facilitar su mantenimiento y escalabilidad.

-   `/`: Archivos raíz de configuración y entrada (`index.html`, `index.tsx`, `metadata.json`, `types.ts`).
-   `/components`: Contiene todos los componentes de React reutilizables que conforman la interfaz de usuario.
    -   `/components/icons`: Componentes de React para los iconos SVG.
-   `/context`: Contiene los proveedores de Contexto de React para gestionar el estado global (ej. configuración de visibilidad de columnas).
-   `/services`: Módulos responsables de la comunicación con APIs externas, como `geminiService.ts`.
-   `/utils`: Funciones de ayuda y utilidades para tareas como el manejo de archivos (`fileUtils.ts`) y el almacenamiento local (`storageUtils.ts`).

---

## 🛠️ Tecnologías Utilizadas

-   **React 19:** Para la construcción de la interfaz de usuario.
-   **TailwindCSS:** Para un diseño de UI rápido y moderno.
-   **Google Gemini API (`@google/genai`):** El cerebro detrás de la extracción y estructuración de datos.
-   **pdf.js:** Para leer y extraer el contenido de texto de los archivos PDF en el cliente.
-   **xlsx.js:** Para generar archivos Excel (`.xlsx`) en el navegador.
