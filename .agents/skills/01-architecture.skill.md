---
name: "Modo Atleta Angular Architecture"
description: "Activa esta skill al crear, modificar o revisar estructura de carpetas, módulos, features, servicios o arquitectura Angular del proyecto."
---

# Instrucciones de la Skill

## Estructura obligatoria

```txt
src/app/
  core/
    constants/
    enums/
    models/
    services/
    utils/

  features/
    onboarding/
    dashboard/
    check-in/
    workouts/
    evaluation/
    meals/
    progress/
    settings/

  shared/
    components/
    pipes/
    directives/

  layout/
    mobile-shell/
    bottom-nav/
    header/
```

## Responsabilidades

### core/

Contiene piezas globales y reutilizables:

- Modelos.
- Enums.
- Constantes.
- Servicios base.
- Utilidades puras.

### features/

Contiene módulos funcionales de la app:

- Onboarding.
- Dashboard.
- Check-in.
- Workouts.
- Evaluation.
- Meals.
- Progress.
- Settings.

### shared/

Contiene componentes y utilidades visuales reutilizables:

- Cards.
- Badges.
- Empty states.
- Loaders.
- Pipes.
- Directives.

### layout/

Contiene estructura visual general:

- Mobile shell.
- Header.
- Bottom navigation.

## Reglas de arquitectura

- No colocar lógica de negocio en componentes.
- No acceder directamente a `localStorage` desde componentes.
- No mezclar lógica de comidas con lógica de entrenamientos.
- No crear servicios gigantes.
- Cada servicio debe tener una responsabilidad clara.
- Los features no deben depender directamente entre sí si pueden usar servicios de `core`.
- La lógica debe ser testeable sin necesidad de renderizar UI.
- La app debe quedar preparada para migrar de storage local a backend sin reescribir componentes.
