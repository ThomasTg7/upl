# UPL Series — Uruguay Premium League

Plataforma web de la promotora de MMA **UPL Series** (Uruguay Premium League): sitio público (eventos, cartelera y resultados, peleadores, rankings, noticias, entradas) y panel de administración propio. Es un clon de la plataforma OFL con **todas** sus funciones (panel, peleas, eventos, noticias, rankings, patrocinadores, bandeja, noche de pelea en vivo…) y la identidad visual de UPL.

Repositorio independiente: <https://github.com/ThomasTg7/upl> (rama `main`). No comparte historial ni servicios con OFL: la base de datos, el almacenamiento de imágenes y el despliegue de UPL se configuran aparte (`docs/deploy.md`, `docs/vps-migration.md`).

## Ver el proyecto en tu computador (paso a paso)

Requisitos (una sola vez):

- **Node.js 22** — <https://nodejs.org> (elige la versión 22 LTS).
- **pnpm** — después de instalar Node, en una terminal: `corepack enable` (o `npm install -g pnpm`).
- **Docker Desktop** — <https://www.docker.com/products/docker-desktop/> (levanta la base de datos Postgres). Ábrelo y déjalo corriendo.
- **Git** — <https://git-scm.com>.

1. Descarga el código:

   ```bash
   git clone https://github.com/ThomasTg7/upl.git
   cd upl
   ```

2. Crea tu archivo de configuración local:

   ```bash
   cp .env.example .env
   ```

   En Windows (PowerShell): `Copy-Item .env.example .env`. Los valores por defecto ya sirven para verlo en local.

3. Levanta la base de datos, instala y carga los datos de demostración:

   ```bash
   docker compose up -d
   pnpm install
   pnpm db:migrate
   pnpm db:seed
   pnpm create-admin admin@upl.local "UplDemo2026!"
   ```

   `pnpm db:seed` deja **UPL 15** como próximo evento (afiche incluido): *Mateo Hernández vs Juan Rodriguez — Defensa del título UPL amateur — 21 de noviembre, 15:00, CEDEC*, con las fotos recortadas de ambos peleadores y la noticia destacada del anuncio. Los eventos UPL 11–14, el resto de los peleadores y noticias son datos de ejemplo para ver todas las secciones con contenido.

4. Inicia el sitio:

   ```bash
   pnpm dev --port 3002
   ```

   - Sitio público: <http://localhost:3002>
   - Panel: <http://admin.localhost:3002> — entra con `admin@upl.local` / `UplDemo2026!` (o los datos que hayas puesto en el paso 3).

   La primera carga de cada página tarda unos segundos en modo desarrollo (se compila al vuelo). Para verlo a velocidad real: `pnpm build && pnpm start` (puerto 3000; panel en `http://admin.localhost:3000`, y en `.env` cambia `SITE_URL`/`ADMIN_URL` a ese puerto).

¿Quieres empezar de cero? `docker compose down -v` borra la base; borra también la carpeta `.storage/` (las fotos) y repite el paso 3.

## Identidad visual

Tomada del logo y del afiche de UPL 15:

| Elemento | Valor |
|---|---|
| Fondo | negro de estudio `#000`, superficies grafito `#121110` / `#1d1b18`, humo animado detrás de las portadas |
| Color de marca | oro del cinturón `#D9A82E` (texto negro encima), claro `#F2CE6B`, profundo `#8A6318`; degradado metálico en títulos, precios y «VS» |
| Tipografías | Anton en itálica (los titulares, como «UPL 15»), Barlow Condensed (etiquetas y subtítulos espaciados, como «DEFENSA DEL TÍTULO»), Barlow (texto), Montserrat Black itálica (el estilo de «SERIES» y los nombres del afiche) |
| Motivo | el corte diagonal del logo: una hoja dorada y su contorno blanco (`BrandMark`), subrayados y reglas inclinadas |
| Fotos | peleadores recortados sin fondo sobre humo grafito con luz dorada; el afiche completo como imagen del evento |

Animaciones (todas con `transform`/`opacity` y desactivadas con «reducir movimiento»): humo que deriva detrás de la portada, el corte diagonal que entra en diagonal, el texto de la cartelera que sube en cascada, un brillo dorado que recorre «Comprar entradas», además de todas las del original (careo con parallax, cartelera fija al hacer scroll, cintas, transición de páginas, presentación del logo, modal «Dónde ver»).

Archivos clave: `src/app/globals.css` (tokens), `src/app/upl-public.css`, `src/app/upl-motion.css`, `src/app/upl-admin.css`, `src/domain/brand.ts`, `src/components/brand/`, `public/upl-logo-transparent.webp`.

## Datos de la vitrina

- `src/features/showcase/seed.ts` (solo lo corre `pnpm db:seed`; las pruebas usan los seeds de cada feature): renumera los eventos de ejemplo a UPL 11–15 y deja UPL 15 con los datos del afiche, crea a Mateo Hernández (campeón amateur, con el cinturón) y Juan Rodriguez, la pelea estelar por el título y la noticia.
- Imágenes de origen en `scripts/seed-assets/` (afiche, recortes sin fondo, rostros y portada de la noticia). Pasan por el mismo proceso que una subida del panel (variantes WebP).
- Patrocinadores: los del afiche (UMMAF, Granolate, Chiripa, Sak) con logos de texto provisorios y URLs de ejemplo — reemplázalos en **Panel → Patrocinadores**.

**Datos a confirmar con la promotora** (se editan desde el panel): récords y división de Hernández y Rodriguez (quedaron 6-1-0 y 5-1-0 amateur, peso ligero), dirección y ciudad del CEDEC, precios de entradas, enlace de la ticketera, y el Instagram oficial (`src/domain/brand.ts`; las redes también se configuran en **Configuración → Redes sociales**).
