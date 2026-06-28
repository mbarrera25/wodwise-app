---
name: "Modo Atleta SCSS Style"
description: "Activa esta skill al crear o modificar estilos SCSS, variables visuales, clases, layout responsive o temas del proyecto."
---

# Instrucciones de la Skill

## Regla principal

Cada componente maneja su propio archivo `.scss`.

No usar estilos inline.

## Variables globales

Usar variables globales para:

- Colores.
- Espaciado.
- Bordes.
- Sombras.
- Tipografía.
- Breakpoints.

Ejemplo:

```scss
:root {
  --app-bg: #f8fafc;
  --app-surface: #ffffff;
  --app-primary: #2563eb;
  --app-text: #0f172a;
  --app-muted: #64748b;
  --app-radius: 18px;
}
```

## Reglas

- No repetir colores hardcodeados por toda la app.
- Usar clases semánticas.
- Evitar selectores demasiado profundos.
- No abusar de `!important`.
- Mantener estilos cercanos al componente.
- Respetar mobile-first.
- Usar media queries solo cuando sea necesario.

## Naming recomendado

Usar clases semánticas:

```scss
.dashboard-card {}
.metric-card {}
.workout-summary {}
.coach-recommendation {}
.meal-suggestion {}
```

## Antipatrón

```html
<div style="margin-top: 20px; color: blue">
```

Debe ser:

```html
<div class="dashboard-card">
```

Con estilos en el `.scss`.
