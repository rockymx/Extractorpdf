# Prompts de Extracción de Datos - Columnas Específicas

## Ubicación del código
El prompt principal se encuentra en `services/geminiService.ts` en la función `extractDataWithGemini`.

## Prompts para las columnas solicitadas:

### 1. **Alta** (columna 4 en la grilla)
```
**alta**: Check the "ALTA" column (column 4 in the grid with many columns). If it's marked with an 'X', the value is 'X'. Otherwise, return an empty string.
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
            description: "Si la columna 'ALTA' está marcada con 'X', el valor es 'X', si no, vacío." 
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
     * **alta**: Check the "ALTA" column (column 4 in the grid with many columns). If it's marked with an 'X', the value is 'X'. Otherwise, return an empty string.
     * **diasIncapacidad**: Extract the number from the "DÍAS DE INCAPACIDAD" column (column 6 in the grid with many columns). If empty, return an empty string.
     // ... otros campos
```

## Notas Importantes

1. **Tipo de datos**: Todos los campos se extraen como `STRING` aunque contengan números
2. **Valores vacíos**: Si no hay datos, se retorna una cadena vacía `""`
3. **Marcas X**: Para el campo "Alta", específicamente se busca la marca 'X'
4. **Posición de columnas**: Se hace referencia específica a las posiciones de columna (4, 5, 6) para mayor precisión
5. **Contexto de grilla**: Se especifica que son columnas dentro de "the grid with many columns" para diferenciarlas de otros elementos del documento