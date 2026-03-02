# The Seed Cycling — Learning Path App

Web app estática con el learning path de 5 semanas de Valeria. Muestra los 20 pasos del proyecto, sincroniza el progreso en tiempo real entre Valeria y Mili via Supabase, y se hostea gratis en Netlify.

---

## 1. ¿Qué es esta app y cómo usarla?

- Abrís el link de Netlify en tu celular o computadora
- Ves los 20 pasos organizados por semana
- Hacés click en la ✓ de cada paso cuando lo completás
- La barra de progreso arriba sube automáticamente
- Mili puede ver tu progreso en tiempo real desde su browser
- Cada paso tiene un prompt de Claude Code listo para copiar

---

## 2. Crear el proyecto en Supabase (gratis)

### Paso a paso

1. **Crear cuenta** en [supabase.com](https://supabase.com) (gratis, no necesita tarjeta)

2. **Crear nuevo proyecto**:
   - Nombre: `theseedcycling-learning-path`
   - Contraseña: elegí una segura (la vas a necesitar para la base de datos)
   - Región: South America (São Paulo) — la más cercana a Argentina

3. **Esperar** que el proyecto se inicialice (1-2 minutos)

4. **Ir al SQL Editor** (ícono de base de datos en el sidebar izquierdo → SQL Editor)

5. **Pegar y ejecutar** este SQL para crear la tabla y cargar los datos iniciales:

```sql
-- Crear tabla de progreso
CREATE TABLE step_progress (
  step_id       TEXT PRIMARY KEY,
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ
);

-- Deshabilitar Row Level Security para acceso compartido público
ALTER TABLE step_progress DISABLE ROW LEVEL SECURITY;

-- Insertar los 20 pasos iniciales
INSERT INTO step_progress (step_id, completed) VALUES
  ('step_1',  FALSE),
  ('step_2',  FALSE),
  ('step_3',  FALSE),
  ('step_4',  FALSE),
  ('step_5',  FALSE),
  ('step_6',  FALSE),
  ('step_7',  FALSE),
  ('step_8',  FALSE),
  ('step_9',  FALSE),
  ('step_10', FALSE),
  ('step_11', FALSE),
  ('step_12', FALSE),
  ('step_13', FALSE),
  ('step_14', FALSE),
  ('step_15', FALSE),
  ('step_16', FALSE),
  ('step_17', FALSE),
  ('step_18', FALSE),
  ('step_19', FALSE),
  ('step_20', FALSE);
```

6. **Hacer clic en "Run"** (botón verde). Deberías ver "Success. No rows returned."

7. **Activar Realtime** para la tabla:
   - Ir a Database → Replication
   - En "Source" activar la tabla `step_progress`
   - Guardar

---

## 3. Completar config.js con las credenciales

1. **Obtener las credenciales**: en tu proyecto Supabase → Settings (ícono de engranaje) → API

2. **Copiar**:
   - `Project URL` (algo como `https://abcdefgh.supabase.co`)
   - `anon public` key (empieza con `eyJ...`, es larga)

3. **Editar el archivo `config.js`** en la carpeta del proyecto:

```js
// config.js
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';   // ← reemplazá con tu Project URL
const SUPABASE_ANON_KEY = 'eyJ...TU_KEY_LARGA...';        // ← reemplazá con tu anon key
```

> ⚠️ **Importante**: La `anon key` es pública por diseño (solo tiene permisos de lectura/escritura en tu tabla). Está bien incluirla en el código.

---

## 4. Conectar el repo a Netlify (deploy automático)

### Primera vez — crear repo en GitHub

Abrí Terminal en la carpeta del proyecto y corré:

```bash
cd ~/Downloads/Seed\ Cycling/theseedcycling-learning-path

git init
git add .
git commit -m "feat: initial learning path app"

# Reemplazá 'fortunatagithub' con tu usuario de GitHub
gh repo create fortunatagithub/theseedcycling-learning-path --public --source=. --remote=origin --push
```

> Si no tenés `gh` instalado, podés crear el repo manualmente en github.com y seguir los comandos que te da.

### Conectar a Netlify

1. Ir a [app.netlify.com](https://app.netlify.com) → "Add new site" → "Import an existing project"
2. Elegir **GitHub** como proveedor
3. Buscar y seleccionar `theseedcycling-learning-path`
4. En la configuración del build:
   - Build command: (dejar vacío)
   - Publish directory: `.`
5. Hacer clic en **"Deploy site"**
6. En 1-2 minutos tenés tu URL pública (algo como `luminous-croissant-abc123.netlify.app`)

> Para tener una URL más linda, en Netlify → Site settings → Domain management → podés cambiarla a `theseedcycling-learning-path.netlify.app`

---

## 5. Cómo hacer push para actualizar la web

Cada vez que modifiques algo en la app:

```bash
cd ~/Downloads/Seed\ Cycling/theseedcycling-learning-path

git add .
git commit -m "update: descripción breve de lo que cambiaste"
git push
```

Netlify detecta el push automáticamente y redeploya en menos de 2 minutos. No hace falta hacer nada más.

---

## Estructura de archivos

```
theseedcycling-learning-path/
├── index.html      ← app completa (los 20 pasos)
├── styles.css      ← diseño mobile-first, paleta de marca
├── app.js          ← lógica: progreso, Supabase, clipboard
├── config.js       ← tus credenciales de Supabase ← EDITÁ ESTO
├── netlify.toml    ← configuración de deploy
└── README.md       ← este archivo
```

---

## Modo offline (sin Supabase)

Si `config.js` tiene las credenciales de placeholder (`TU_PROYECTO`, `TU_ANON_KEY`), la app funciona igual pero guarda el progreso solo en tu browser (localStorage). Eso significa que Valeria y Mili ven estados independientes. Para sincronización en tiempo real, completar Supabase es necesario.

---

*Hecho con Claude Code · The Seed Cycling · Mendoza, Argentina · 2025*
