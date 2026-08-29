# EcoAhorro IoT

Frontend completo del MVP visual **EcoAhorro IoT**, creado para demostrar ante un jurado cómo una familia podría comprender el consumo de su vivienda, identificar posibles desperdicios y comparar acciones correctivas sin sensores, backend ni internet.

> Modo demostración: todos los sensores, alertas e historiales son datos simulados. Los resultados económicos, energéticos y de CO₂ son estimaciones y no constituyen una certificación oficial.

## Alcance

- Explicación interactiva y segura de una instalación futura.
- Simulador determinista con nueve escenarios y controles personalizados.
- Reglas locales para posible desperdicio, iluminación, temperatura, humedad, aire, errores y desconexión.
- Dashboard residencial, zonas del hogar, gráficas, alertas y reporte imprimible.
- Configuración y gestión de alertas persistidas en `localStorage`.
- Estados de carga, vacío, error, 404 y datos desconectados.
- Contratos TypeScript preparados para una futura fuente API, sin solicitudes reales.

No incluye firmware, ESP32, MQTT, HiveMQ, Supabase, base de datos, autenticación, API, control físico ni modelos de IA.

## Stack

React 19, Vite, TypeScript estricto, Tailwind CSS, React Router, Framer Motion, Recharts, Lucide React, Zod, React Hook Form, Vitest y Testing Library.

## Instalación y comandos

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
npm run test
npm run build
npm run preview
```

Vite mostrará la URL local, normalmente `http://localhost:5173`.

## Despliegue en Vercel

El repositorio incluye `vercel.json` con la detección de Vite, el comando de construcción, la carpeta de salida y el rewrite necesario para abrir o recargar directamente rutas de React Router como `/simulador` y `/dashboard`.

### Desde un repositorio Git

1. Sube el proyecto a GitHub, GitLab o Bitbucket.
2. En Vercel, selecciona **Add New → Project** e importa el repositorio.
3. Vercel utilizará automáticamente:
   - Framework: `Vite`.
   - Comando de construcción: `npm run build`.
   - Directorio de salida: `dist`.
4. No agregues variables de entorno: este MVP funciona con datos locales simulados.
5. Pulsa **Deploy**.

Cada cambio enviado a la rama de producción generará un nuevo despliegue. Después del primer despliegue, comprueba también una recarga directa de `/simulador`, `/dashboard`, `/alertas` y `/reportes`.

### Desde Vercel CLI

Con una cuenta de Vercel iniciada:

```bash
npx vercel
npx vercel --prod
```

El primer comando crea un despliegue de prueba; el segundo publica en producción.

## Rutas

- `/`: propuesta de valor, problema, funcionamiento e impacto.
- `/instalacion`: recorrido visual guiado de 11 pasos.
- `/simulador`: escenario principal y controles de simulación.
- `/dashboard`: indicadores, seis visualizaciones y tabla de zonas residenciales.
- `/dashboard/ambientes/:environmentId`: historial y detalle de una zona del hogar.
- `/alertas`: gestión local de alertas.
- `/reportes`: reporte interno imprimible.
- `/configuracion`: umbrales y supuestos persistentes.
- Cualquier otra ruta muestra una página 404.

## Arquitectura

```text
src/
├── app/          # Router y estado global local
├── components/   # Componentes reutilizables
├── data/         # Datos y escenarios deterministas
├── domain/       # Tipos, esquemas, reglas y cálculos puros
├── features/     # Visuales del simulador
├── hooks/        # Carga a través del contrato de datos
├── layouts/      # Navegación responsive
├── pages/        # Rutas de producto
├── services/     # EcoAhorroDataSource y adaptadores
├── tests/        # Pruebas unitarias y de recorrido
└── utils/        # Persistencia segura y formato
```

La interfaz obtiene los datos residenciales a través de `EcoAhorroDataSource`. `MockEcoAhorroDataSource` es la implementación activa. `ApiEcoAhorroDataSource` existe únicamente como límite futuro y devuelve un error controlado; no hace HTTP.

## Datos simulados

La vivienda ficticia es **Hogar Eco Tarija**, con cinco zonas: sala, cocina, dormitorio, ingreso/pasillo y lavandería. Los historiales de 30 días incluyen rutinas domésticas reproducibles, consumo en horarios de mañana y noche, consumo sin actividad, cambios ambientales y un nodo desconectado. No se usa `Math.random()`.

Cada lectura de sensor lleva `source: "simulated"`; los resultados calculados llevan `source: "estimated"`. El cambio del aire es relativo a una línea base simulada y nunca se presenta como ppm.

## Recorrido recomendado para la demostración

1. Abrir **Simulador**.
2. Elegir **Casa sin actividad con consumo**.
3. Pulsar **Iniciar simulación**.
4. Explicar la evidencia de “posible desperdicio”.
5. Pulsar **Aplicar recomendación**.
6. Comparar 420 W antes con 8 W después y revisar el ahorro potencial.
7. Abrir **Dashboard**, **Alertas** y finalmente **Reportes**.

## Pruebas

`npm run test` cubre reglas de desperdicio e iluminación, histéresis, escenarios de error/desconexión, energía, costo, ahorro, CO₂, persistencia segura, rutas, avisos obligatorios y el recorrido vertical principal.

## Limitaciones y preparación futura

- Las cifras no pertenecen a una vivienda real y no garantizan ahorro.
- Un PIR solo indica que no se detectó actividad; no confirma ausencia absoluta.
- El INA219 se menciona únicamente para una maqueta de corriente continua de baja tensión; nunca se conecta al medidor domiciliario ni a 220 V.
- Una vivienda real requeriría un medidor para corriente alterna o una pinza de corriente certificados, instalados en el tablero por personal capacitado. El medidor sellado de la empresa eléctrica no se interviene.
- El MQ-135 no reemplaza instrumentación ambiental profesional.
- El reporte es interno y demostrativo, no una auditoría.
- `ApiEcoAhorroDataSource` y comentarios `TODO` marcan los puntos para API, MQTT, autenticación y sincronización cuando exista infraestructura autorizada.

El próximo paso técnico recomendado es validar el recorrido con usuarios y el jurado, ajustar umbrales de demostración y, solo después, diseñar un contrato de API versionado a partir de los tipos existentes.
