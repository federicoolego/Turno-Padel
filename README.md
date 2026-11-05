# Pádel Studio

App web estática (HTML + CSS + JS, sin build ni dependencias) con dos pestañas para generar imágenes de pádel en formato 4:5 (1080×1350 px), listas para compartir por WhatsApp:

| Pestaña | Qué genera |
| --- | --- |
| **Flyers Torneos** | 6 flyers distintos de un torneo de pádel. |
| **Recordatorio Turnos** | 6 imágenes de recordatorio de un turno de pádel. |

El header (con las pestañas) y el pie quedan **fijos** al hacer scroll; el pie lleva la firma al centro y la versión a la derecha.

Cada pestaña tiene su link directo: `.../Padel-Studio/#flyers` y `.../Padel-Studio/#turnos`.

El icono **?** de arriba a la derecha abre un instructivo con lo que hace cada pestaña. El tema de la app (🌙/☀️) está al lado.

## Flyers Torneos

### Modelos

| Modelo | Idea |
| --- | --- |
| **Banda** | Categoría gigante y fecha en una banda de color. |
| **Marcador** | Datos en una tabla estilo scoreboard. |
| **Pelota** | Composición centrada con la fecha dentro de una pelota. |
| **Afiche** | Bloque diagonal de color con el título. |
| **Ticket** | Entrada con muescas y línea de corte. |
| **Calendario** | Hoja de almanaque con el día en grande. |

### Personalización de los flyers

- **Tema:** oscuro o claro.
- **Paleta:** Cancha, Césped, Arcilla, Violeta, Rojo, Turquesa y Grafito.
- **Fondo:** Auto (cada modelo trae el suyo), Liso, Cancha, Rayas, Malla, Puntos o Círculos.

La elección se recuerda en el navegador.

### Campos

| Campo | Obligatorio |
| --- | --- |
| Complejo | Sí |
| Logo del complejo | No |
| Categorías (hasta 3 torneos en simultáneo) | Sí, al menos 1 |
| Fecha de inicio | Sí (hora opcional; igual para todas las categorías) |
| Fecha de fin | No (vacía = mismo día) |
| Inscripción ($) | No |
| Premio | No |
| Contactos (nombre + teléfono) | Sí, de 1 a 3 |

Todos los flyers muestran el nombre del complejo una sola vez y en grande, precedido por el logo (o por un pin de ubicación si no hay logo), y la nota "Inscripción abierta" antes de los contactos.

### Datos guardados en el navegador

La app recuerda automáticamente (localStorage) el **nombre del complejo**, el **logo** y los **contactos**, para no cargarlos en cada torneo. Categorías, fechas, inscripción y premio se cargan cada vez. También se recuerdan el tema, la paleta y el fondo elegidos.

- Se guarda por navegador y por dispositivo: no se comparte entre el celular y la compu.
- No persiste en ventanas privadas ni si se borran los datos del sitio.
- El botón "Borrar datos guardados" (abajo del formulario) elimina el complejo, el logo y los contactos.

## Recordatorio Turnos

Genera 6 imágenes con el día, la hora, el lugar, la cancha y los jugadores del turno, más el cartel "Confirmado" y la frase "¡Nos vemos en la cancha!".

### Modelos

| Modelo | Idea |
| --- | --- |
| **Tarjeta** | Panel con una fila e ícono por dato (fecha, hora, lugar, cancha). |
| **Hora** | La hora en gigante y el resto de los datos debajo. |
| **Pelota** | La hora dentro de una pelota de tenis. |
| **Cancha** | La cancha vista desde arriba, con el nombre de la cancha en el centro. |
| **Ticket** | Entrada con muescas y línea de corte. |
| **Calendario** | Hoja de almanaque con el día en grande. |

Mismas opciones que los flyers: **tema** oscuro o claro, **paleta** (7) y **fondo** (Auto, Liso, Cancha, Rayas, Malla, Puntos, Círculos). Las opciones de cada pestaña se recuerdan por separado.

### Campos

| Campo | Obligatorio |
| --- | --- |
| Fecha (arranca en hoy) | Sí |
| Hora | Sí |
| Lugar | Sí |
| Cancha (si es solo un número, la imagen dice "Cancha 2") | No |
| Jugadores (hasta 4) | No |

Si el turno es hoy o mañana, las imágenes lo marcan con un cartelito **HOY** / **MAÑANA**. En todas las imágenes lo que más resalta es la **fecha**, la **hora** y el **lugar**. Llevan la marca "🎾 Desarrollado por Federico Olego 🎾" abajo, en negrita.

### Datos guardados en el navegador

Se recuerdan (localStorage) el **lugar**, la **cancha** y los **jugadores**. La fecha y la hora se cargan cada vez. El botón "Borrar datos guardados" (abajo del formulario) los elimina.

## Compartir por WhatsApp

Debajo de cada imagen hay un botón de descarga y uno de WhatsApp. **Se comparte solo la imagen, sin texto.**

- **Celular:** abre el menú nativo de compartir con la imagen adjunta.
- **Escritorio:** descarga la imagen, la copia al portapapeles (si el navegador lo permite) y abre WhatsApp Web; en el chat se pega con Ctrl+V o se adjunta a mano.

> La Web Share API con archivos requiere HTTPS (GitHub Pages ya lo da).

## Publicar en GitHub Pages

El sitio se publica con GitHub Actions (`.github/workflows/deploy.yml`) para poder estampar la versión en cada deploy.

1. Subí los archivos a la raíz del repo (rama `main`).
2. En **Settings → Pages → Build and deployment → Source**, elegí **GitHub Actions** (una sola vez).
3. En cada push a `main` se publica solo. La app queda en `https://<usuario>.github.io/<repo>/`.

## Versión y aviso de actualización

- La versión se sube **a mano** en `version.json` (`"version": "1.1.0"`) cuando hay cambios visibles para los usuarios. Se ve en el pie de página (`v1.0.0`; pasando el mouse, el build y la fecha).
- En cada deploy, el workflow genera `version.json` y `version.js` con el **build** (commit corto) y la fecha. La app consulta `version.json` cada 5 minutos y al volver a la pestaña: si el build publicado es distinto del que está corriendo, muestra el cartel **"Hay una versión nueva · Actualizar"** (con "Más tarde" para ocultarlo hasta la próxima versión).
- El cartel sale en cada deploy aunque no se cambie `version`; conviene subirla cuando hay cambios para que el usuario vea el número.
- "Actualizar" recarga con `?v=<build>` para saltear la caché de GitHub Pages. Los archivos se cargan con `?v=<build>`, así que nadie queda con un `app.js` viejo.
- Los datos que la app no guarda sola (categorías, fechas, inscripción, premio) se pierden al actualizar; el cartel lo avisa.
- Local (sin Actions): `version.js` y `version.json` quedan con build `dev` y el cartel nunca aparece.

## Estructura

```
index.html   Formulario y contenedores
styles.css   Estilos de la app (colores del sitio de proyectos)
app.js       Pestañas y ayuda, validación, dibujo en canvas de cada modelo (flyers y turnos), compartir/descargar, aviso de versión
version.js   Versión que está corriendo (la regenera el deploy)
version.json Versión publicada (la sube a mano; el build lo pone el deploy)
.github/workflows/deploy.yml   Deploy a GitHub Pages con versión y build
```

## Personalizar

- **Paletas:** arreglo `PALETTES` al inicio de `app.js`.
- **Fondos:** función `drawPattern`.
- **Nuevo modelo de flyer:** crear `tplXxx(ctx, data, theme, pattern)` y registrarlo en `TEMPLATES`.
- **Nuevo modelo de turno:** crear `turnoXxx(ctx, data, theme, pattern)` y registrarlo en `TURNO_TEMPLATES`.
- **Nombre de la app:** `<title>`, el `<h1>` y la descripción en `index.html`.
- **Tema de la app:** comparte la clave `theme` de localStorage con https://federicoolego.github.io/federicoolego-/
