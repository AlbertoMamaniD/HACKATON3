# EcoAhorro IoT

> **Controla tu luz y agua desde una sola app y recibe un aviso antes de que te sorprenda el recibo.**
> El monitor de consumo de tu casa, en tu celular.

MVP de **EcoAhorro IoT** (hackathon de triple impacto, Tarija, Bolivia). Muestra cómo una familia puede ver su gasto de luz y agua durante el mes, recibir alertas ante consumos anormales y contrastar lo registrado con su factura. El mensaje principal es el **ahorro económico y el control del gasto**; la reducción de CO₂ se presenta como beneficio adicional.

## Transparencia de datos

La app **sí** usa un ESP32 y Supabase. No todas las métricas vienen del sensor:

| Métrica | Origen | Etiqueta en la interfaz |
| --- | --- | --- |
| Calidad del aire (MQ-135) | ESP32 → Supabase | **Sensor** |
| Iluminación (nivel, estado, segundos continuos) | ESP32 → Supabase | **Sensor** |
| Temperatura y humedad (si el firmware las envía) | ESP32 → Supabase | **Sensor** |
| Potencia eléctrica (W) | **Simulada** en el navegador | **Simulado** |
| Caudal de agua (L/min) | **Simulado** en el navegador | **Simulado** |

- `src/context/LiveReadingsContext.tsx` consulta la tabla `lecturas` cada 5 s y, cuando una fila no trae `potencia_w` o `flujo_agua_lpm`, genera valores deterministas y coherentes con el estado de la luz. Cada lectura enriquecida lleva `fuente_metricas: "simulado"`.
- Las cinco filas más recientes se actualizan en Supabase con esos valores simulados **y** con `fuente_metricas = 'simulado'`, para que cualquiera que lea la base sepa que no son mediciones. Si la columna no existe, la app lo detecta, guarda los valores sin el origen y sigue funcionando (aviso en la consola).
- Dashboard, Alertas, Reportes, la portada y el detalle de zona muestran una etiqueta **Simulado** junto a potencia y caudal, y **Sensor** junto a las lecturas del ESP32. El layout muestra siempre el aviso `DemoNotice`.
- El **simulador** (`/simulador`) usa escenarios deterministas propios, sin `Math.random()`, y no depende de Supabase.
- Las cifras económicas y de CO₂ son **estimaciones**. No garantizan ahorro, no son una auditoría y el reporte no es un documento oficial.

### SQL opcional: columna de origen

Para registrar el origen en la base de datos, ejecuta en el editor SQL de Supabase:

```sql
alter table lecturas add column if not exists fuente_metricas text default 'simulado';

-- Solo si tu tabla todavía no tiene las columnas de potencia y agua:
alter table lecturas add column if not exists potencia_w real;
alter table lecturas add column if not exists flujo_agua_lpm real;
```

Para que la app pueda escribir esos valores con la clave anónima, la tabla necesita una política RLS que permita `update`. Sin ella, la lectura sigue funcionando y los valores simulados se calculan igual en el navegador.

Cuando exista un medidor real de luz o agua, el firmware puede escribir `fuente_metricas = 'sensor'` junto con `potencia_w` y `flujo_agua_lpm`; la interfaz mostrará entonces la etiqueta **Sensor**.

## Funciones alineadas con el Lean Canvas

| Problema | Solución en el MVP | Ruta |
| --- | --- | --- |
| Gasto invisible durante el mes | Alertas ante consumo anormal de luz o agua (y notificaciones del navegador) | `/alertas` |
| Aumentos sin explicación | Historial de consumo de luz y agua (la comparación entre periodos está en desarrollo) | `/dashboard` |
| Cobros que no se pueden comprobar | Reporte estimado de consumo con la sección **Compara con tu factura** | `/reportes` |

**Compara con tu factura**: el usuario ingresa el monto de su última factura de luz y de agua (Bs). La app muestra la diferencia con lo estimado por EcoAhorro en Bs y en %, y la métrica **Precisión frente a la factura (%)** = 100 − |diferencia %|, acotada entre 0 y 100. Los montos se validan con Zod (no negativos) y se guardan solo en el `localStorage` del navegador (`ecoahorro:bill-amounts:v1`).

**Precio (tentativo)**: Kit EcoAhorro 449 Bs pago único, app básica incluida, sin mensualidad, con periodo de prueba antes de comprar.

## Stack

React 19, Vite, TypeScript estricto, Tailwind CSS, React Router, Framer Motion, Recharts, Lucide React, Zod, React Hook Form, Supabase JS, Vitest y Testing Library.

## Variables de entorno

Copia `.env.example` a `.env` y completa:

| Variable | Descripción |
| --- | --- |
| `VITE_SUPABASE_URL` | URL del proyecto, p. ej. `https://tu-proyecto.supabase.co` (si incluye `/rest/v1`, se elimina automáticamente). |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima pública del proyecto. |

Sin estas variables la app funciona, pero el Dashboard, las Alertas y la portada quedan en estado "Esperando lecturas"; el simulador sigue disponible.

## Instalación y comandos

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

Si tu sistema define `NODE_ENV=production`, `npm install` omite las dependencias de desarrollo; usa `npm install --include=dev`.

## Rutas

- `/`: propuesta de valor, los 3 problemas, cómo funciona y precio.
- `/instalacion`: dónde se ubicaría cada componente del kit en la vivienda.
- `/simulador`: escenarios deterministas de consumo y recomendaciones.
- `/dashboard`: luz y agua primero; gases MQ-135 e iluminación en "Extras del sensor".
- `/dashboard/ambientes/:environmentId`: historial de una zona del hogar.
- `/alertas`: alertas de la última lectura, gestión local e historial de incidentes.
- `/reportes`: reporte estimado de consumo, imprimible, con comparación con la factura.
- `/configuracion`: tarifas, umbrales y supuestos persistentes.
- Cualquier otra ruta muestra una página 404.

## Arquitectura

```text
src/
├── app/          # Router y estado global local (configuración y alertas)
├── components/   # Componentes reutilizables (SourceBadge, BillComparison, DemoNotice…)
├── context/      # LiveReadingsContext: polling a Supabase y métricas simuladas
├── data/         # Datos y escenarios deterministas del simulador
├── domain/       # Tipos, esquemas, reglas y cálculos puros (incluye billing.ts)
├── features/     # Visuales del simulador
├── hooks/        # useLiveReadings, useEcoData
├── layouts/      # Navegación responsive
├── pages/        # Rutas de producto
├── services/     # Cliente Supabase y fuentes de datos
├── tests/        # Pruebas unitarias y de recorrido
└── utils/        # Persistencia segura en localStorage y formato
```

## Despliegue en Vercel

El repositorio incluye `vercel.json` con la detección de Vite, el comando de construcción, la carpeta de salida y el rewrite necesario para recargar rutas de React Router.

1. Importa el repositorio en Vercel (**Add New → Project**).
2. Framework `Vite`, comando `npm run build`, salida `dist`.
3. En **Environment Variables** define `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Pulsa **Deploy** y comprueba una recarga directa de `/dashboard`, `/alertas` y `/reportes`.

Con Vercel CLI: `npx vercel` (prueba) y `npx vercel --prod` (producción).

## Recorrido recomendado para la demostración

1. **Inicio**: propuesta de valor, los 3 problemas y el precio.
2. **Dashboard**: potencia y caudal (etiquetados como simulados) y los extras del sensor ESP32.
3. **Alertas**: aviso ante consumo anormal de agua o luz.
4. **Reportes**: ingresar los montos de una factura real y mostrar la diferencia y la precisión.
5. **Simulador**: elegir un escenario con fuga o consumo fantasma, aplicar la recomendación y comparar antes y después.

## Pruebas

`npm run test` cubre reglas de desperdicio e iluminación, escenarios del simulador, energía, costo, ahorro y CO₂, persistencia segura, rutas, avisos obligatorios, la comparación con la factura (cálculo, validación y persistencia) y la presencia de la etiqueta **Simulado** en el Dashboard.

## Limitaciones

- La potencia y el caudal de agua son simulados; la comparación con la factura es orientativa y no sirve como prueba ante la distribuidora.
- Un PIR solo indica que no se detectó actividad; no confirma ausencia absoluta.
- El INA219 solo se considera para una maqueta de corriente continua de baja tensión; nunca se conecta al medidor domiciliario ni a 220 V. Una vivienda real requiere un medidor o pinza de corriente certificados, instalados por personal capacitado. El medidor sellado de la empresa eléctrica no se interviene.
- El MQ-135 no reemplaza instrumentación ambiental profesional; su valor se muestra como variación relativa, no en ppm.
- El precio del kit es tentativo.
