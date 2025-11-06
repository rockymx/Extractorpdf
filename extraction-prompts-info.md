# Prompts de Extracción de Datos - Columnas Específicas

## Ubicación del código
El prompt principal se encuentra en `services/geminiService.ts` en la función `extractDataWithGemini`.

## Prompts para las columnas solicitadas:

### 1. **Alta** (columna 5 bajo numeración de HORA CITA)
```
**alta**: Extract the ALTA status by following these exact steps:

PROCESS:
1. Locate the patient's full name in the "NOMBRE DEL DERECHOHABIENTE" row
2. Find the "HORA CITA" row directly above the patient's name
3. In that "HORA CITA" row, locate the sequential numbering: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
4. Focus specifically on the column marked with number "5"
5. Examine the cell that is immediately BELOW number "5" in the same patient row
6. Evaluate the content:
   - If it contains an "X" → return "SI"
   - If it is empty → return "NO"

CRITICAL RULES:
- ONLY observe the column under number 5, ignore all other columns
- The "X" mark or empty space must be in the SAME ROW as the patient name, under column 5 of HORA CITA
- Do NOT confuse with other columns or marks in the grid

OUTPUT: "SI" or "NO"
```

### 2. **Número de Recetas** (columna 5 en la grilla)
```
**numeroRecetas**: The number from the "NÚMERO DE RECETAS" column (column 5 in the grid with many columns). For row 1, the value is '0'.
```

### 3. **Días de Incapacidad** (columna 6 en la grilla)
```
**diasIncapacidad**: Extract the number from the "DÍAS DE INCAPACIDAD" column (column 6 in the grid with many columns). If empty, return an empty string.
```

## Contexto del Schema de Respuesta

Estas instrucciones forman parte del schema de respuesta estructurado que se envía a Gemini AI:

```typescript
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    // ... otros campos
    patientRecords: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          // ... otros campos
          numeroRecetas: { 
            type: Type.STRING, 
            description: "Número de recetas emitidas (columna 7)." 
          },
          alta: {
            type: Type.STRING,
            description: "Estado de ALTA del paciente: 'SI' si está marcado con X en columna 5 bajo HORA CITA, 'NO' si está vacío."
          },
          diasIncapacidad: { 
            type: Type.STRING, 
            description: "Número de días de incapacidad otorgados." 
          },
          // ... otros campos
        }
      }
    }
  }
}
```

## Prompt Completo de Contexto

El prompt completo incluye estas instrucciones dentro de un contexto más amplio:

```
**Extraction Rules:**

2. **Patient Records (Rows of Data):**
   * Iterate through each row identified by a "No. PROGRESIVO" number (1, 2, 3, etc.).
   * For each patient row, extract the following fields:
     // ... otros campos
     * **numeroRecetas**: The number from the "NÚMERO DE RECETAS" column (column 5 in the grid with many columns). For row 1, the value is '0'.
     * **alta**: Extract ALTA status from column 5 under HORA CITA numbering. Look at the cell directly below number "5" in the patient's row. Return "SI" if marked with "X", "NO" if empty.
     * **diasIncapacidad**: Extract the number from the "DÍAS DE INCAPACIDAD" column (column 6 in the grid with many columns). If empty, return an empty string.
     // ... otros campos
```

## Notas Importantes

1. **Tipo de datos**: Todos los campos se extraen como `STRING` aunque contengan números
2. **Valores vacíos**: Si no hay datos, se retorna una cadena vacía `""`
3. **Campo ALTA**:
   - Se identifica buscando la columna 5 en la numeración de HORA CITA (1-12)
   - Se examina la celda directamente debajo del número 5 en la fila del paciente
   - Retorna "SI" si contiene "X", "NO" si está vacía
   - Es diferente a otras columnas de la grilla principal
4. **Posición de columnas**: Se hace referencia específica a las posiciones de columna para mayor precisión
5. **Contexto de grilla**: Se especifica que son columnas dentro de "the grid with many columns" para diferenciarlas de otros elementos del documento