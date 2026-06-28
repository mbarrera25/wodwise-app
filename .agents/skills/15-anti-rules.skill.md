---
name: "Modo Atleta Anti Rules"
description: "Activa esta skill al revisar código, PRs, refactors o decisiones técnicas para detectar cosas que NO deben hacerse en fase 1."
---

# Instrucciones de la Skill

## Cosas que NO se deben hacer

- No meter IA en el MVP inicial.
- No meter backend antes de validar el flujo.
- No meter autenticación en fase 1.
- No usar componentes gigantes.
- No guardar datos directamente desde componentes.
- No hacer formularios sin validación.
- No usar strings mágicos.
- No mezclar lógica de comidas con lógica de WOD.
- No hacer diseño desktop-first.
- No meter tablas complejas en mobile.
- No usar estilos inline.
- No crear modelos desordenados.
- No crear servicios tipo `GodService`.
- No prometer resultados médicos o físicos exactos.
- No usar Bootstrap.
- No usar jQuery.
- No mezclar varias librerías UI sin justificación.
- No acceder directamente a `localStorage` desde componentes.
- No calcular reglas del coach dentro de páginas.
- No hardcodear labels repetidos en templates.
- No crear lógica duplicada entre servicios.

## Revisión obligatoria antes de aceptar cambios

Antes de aceptar una implementación, validar:

1. ¿Respeta mobile-first?
2. ¿La lógica de negocio está en servicios?
3. ¿Los componentes tienen `.ts`, `.html` y `.scss`?
4. ¿Usa enums/constantes en vez de strings mágicos?
5. ¿Usa Reactive Forms en formularios?
6. ¿Usa Signals de forma razonable?
7. ¿No agregó backend/IA/auth innecesariamente?
8. ¿No mezcló responsabilidades?
9. ¿Puede probarse la lógica principal?
