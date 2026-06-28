---
name: "Modo Atleta Project Overview"
description: "Activa esta skill al trabajar en cualquier parte del proyecto Modo Atleta / WODWise para recordar el objetivo, alcance, restricciones y visión general del MVP."
---

# Instrucciones de la Skill

## Contexto del proyecto

**Modo Atleta / WODWise** es una PWA mobile-first desarrollada en Angular para registrar entrenamientos, check-ins diarios, comidas, progreso físico y recomendaciones tipo coach.

La primera versión debe funcionar sin backend, sin autenticación y sin IA externa. La app debe usar un motor interno de reglas para evaluar entrenamientos, detectar avances y generar consejos básicos.

## Objetivo del MVP

La fase 1 debe permitir:

1. Crear un perfil básico del usuario.
2. Registrar check-ins diarios.
3. Registrar entrenamientos.
4. Evaluar entrenamientos mediante reglas internas.
5. Recomendar recuperación y comidas básicas.
6. Mostrar resumen semanal y avances notables.
7. Persistir datos localmente.

## Fuera de alcance en fase 1

No implementar todavía:

- Backend.
- Autenticación.
- IA externa.
- Pagos.
- App nativa.
- Sincronización multi-dispositivo.
- Fotos de progreso.
- Planes médicos o nutricionales estrictos.

## Stack oficial

- Angular.
- TypeScript.
- SCSS.
- PrimeNG.
- Angular PWA.
- Signals.
- Reactive Forms.
- LocalStorage o IndexedDB.
- Chart.js o ECharts en fases futuras.

## Principios del proyecto

- Mobile-first.
- Rápida de usar desde el celular.
- Útil para personas que entrenan CrossFit, gym, running, funcional, senderismo o entrenamiento híbrido.
- Motivadora, práctica y sin tono médico.
- Escalable para agregar Supabase, IA y sincronización en fases futuras.
- Lógica de negocio separada de la UI.
