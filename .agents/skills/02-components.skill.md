---
name: "Modo Atleta Component Rules"
description: "Activa esta skill al crear o modificar componentes, páginas, templates, estilos SCSS o componentes reutilizables en Angular."
---

# Instrucciones de la Skill

## Regla obligatoria de archivos

Todo componente debe tener archivos separados:

```txt
component-name.component.ts
component-name.component.html
component-name.component.scss
```

Para páginas:

```txt
dashboard.page.ts
dashboard.page.html
dashboard.page.scss
```

## Prohibido

- Templates inline.
- Estilos inline.
- Componentes gigantes.
- Lógica de negocio en componentes.
- Acceso directo a almacenamiento local desde componentes.
- Cálculos complejos en el template.

## Convenciones de nombres

### Páginas

Deben terminar en `.page`.

```txt
dashboard.page.ts
workout-form.page.ts
evaluation.page.ts
progress.page.ts
```

### Componentes reutilizables

Deben terminar en `.component`.

```txt
coach-card.component.ts
workout-summary-card.component.ts
meal-suggestion-card.component.ts
progress-metric-card.component.ts
```

## Responsabilidad única

Cada componente debe responder a una sola pregunta:

- ¿Muestra una tarjeta?
- ¿Renderiza un formulario?
- ¿Lista entrenamientos?
- ¿Muestra una evaluación?
- ¿Representa una métrica?

Si un componente empieza a tener demasiadas responsabilidades, dividirlo.

## Componentes de página

Los componentes de página pueden:

- Coordinar servicios.
- Preparar datos para la vista.
- Manejar navegación.
- Recibir eventos de componentes hijos.

No deben:

- Calcular reglas del coach.
- Generar recomendaciones.
- Procesar estadísticas complejas.
- Manipular storage directamente.

## Componentes presentacionales

Los componentes presentacionales deben recibir datos por inputs y emitir eventos por outputs.

Deben evitar dependencias innecesarias con servicios globales.
