# 🎫 Helpdesk App

Sistema de gestión de tickets de soporte construido con Angular 18+ standalone, Angular Material v18+ (MDC) y json-server como backend de desarrollo.

---

## ▶️ Cómo correr el proyecto

### Requisitos previos

- Node.js 18+
- npm 9+
- Angular CLI 18+

```bash
npm install -g @angular/cli
```

### Instalación

```bash
git clone <repo-url>
cd helpdesk-app
npm install
```

### Levantar el backend (json-server)

```bash
npm run mock-api
# Corre en http://localhost:3000
```

### Levantar la app

```bash
npm start
# Disponible en http://localhost:4200
```

### Build de producción

```bash
npm run build
```

---

## 🗂️ Estructura del proyecto

```
src/
├── app/
│   ├── core/                        # Singleton: guards
│   │   └── guards/
│   │       └── pending-changes.guard.ts     # Protege formularios con cambios sin guardar
│   │
│   ├── shared/                      # Componentes y modelos reutilizables
│   │   └── models/
│   │       └── ticket.model.ts      # Interfaces: Ticket, TicketStatus, TicketPriority, TicketCategory
│   │
│   ├── features/
│   │   └── tickets/                 # Feature module completo
│   │       ├── tickets.module.ts
│   │       ├── tickets.routes.ts            # Rutas del feature con lazy loading
│   │       ├── components/
│   │       │   ├── ticket-comments/
│   │       │   │   ├── ticket-comments.component.ts
│   │       │   │   ├── ticket-comments.component.html
│   │       │   │   └── ticket-comments.component.css
│   │       │   ├── ticket-filters/
│   │       │   │   ├── ticket-filters.component.ts
│   │       │   │   ├── ticket-filters.component.html
│   │       │   │   └── ticket-filters.component.css
│   │       │   └── ticket-header/
│   │       │       ├── ticket-header.component.ts
│   │       │       ├── ticket-header.component.html
│   │       │       └── ticket-header.component.css
│   │       ├── pages/
│   │       │   ├── tickets-list/
│   │       │   │   ├── tickets-list.component.ts
│   │       │   │   ├── tickets-list.component.html
│   │       │   │   └── tickets-list.component.css
│   │       │   ├── ticket-detail/
│   │       │   │   ├── ticket-detail.component.ts
│   │       │   │   ├── ticket-detail.component.html
│   │       │   │   └── ticket-detail.component.css
│   │       │   └── ticket-form/
│   │       │       ├── ticket-form.component.ts
│   │       │       ├── ticket-form.component.html
│   │       │       └── ticket-form.component.css
│   │       └── services/
│   │           └── tickets.service.ts       # Toda la lógica HTTP
│   │
│   ├── app.routes.ts                # Rutas raíz con loadComponent
│   └── app.config.ts                # Bootstrap standalone
│
├── db.json                          # Base de datos de json-server
└── ...
```

---

## 🏗️ Decisiones de arquitectura

### Standalone components
Se eligió la API standalone (sin `NgModule`) disponible desde Angular 15. Cada componente declara sus propias dependencias en `imports: []`, lo que elimina módulos intermedios y hace el árbol de dependencias más explícito y tree-shakeable.

### Lazy loading con `loadChildren`
El router raíz usa `loadChildren` para cargar el feature de tickets de forma lazy. El archivo de rutas del feature (`tickets.routes.ts`) queda completamente aislado del bundle principal:

```typescript
// app.routes.ts
{
  path: 'tickets',
  loadChildren: () =>
    import('./features/tickets/tickets.routes').then(m => m.routes)
}
```

```typescript
// features/tickets/tickets.routes.ts
export const routes: Routes = [
  { path: '',        loadComponent: () => import('./pages/tickets-list/tickets-list.component').then(m => m.TicketsListComponent) },
  { path: 'new',     loadComponent: () => import('./pages/ticket-form/ticket-form.component').then(m => m.TicketFormComponent) },
  { path: ':id',     loadComponent: () => import('./pages/ticket-detail/ticket-detail.component').then(m => m.TicketDetailComponent) },
  { path: ':id/edit',loadComponent: () => import('./pages/ticket-form/ticket-form.component').then(m => m.TicketFormComponent) },
];
```

El bundle principal no contiene ningún componente de tickets — Angular los descarga en chunks separados la primera vez que se navega a esa ruta.

### ViewEncapsulation.None + selectores MDC
Angular Material v15+ migró a MDC (Material Design Components). Los selectores internos cambiaron de `mat-card-header` a `.mat-mdc-card-header`, por lo que los estilos del componente deben poder alcanzarlos. Se usó `ViewEncapsulation.None` en todos los componentes en lugar de `::ng-deep`, que está deprecated.

### ChangeDetectionStrategy.OnPush
Los tres componentes usan `OnPush`. Angular solo re-renderiza cuando cambia una referencia de `@Input`, se emite un observable con `async pipe`, o se llama `cdr.markForCheck()` manualmente. Esto evita ciclos de detección innecesarios en listas grandes.

### RxJS: pipe-first, sin subscribes anidados
Todo el manejo de efectos secundarios vive dentro del pipe del observable:

```typescript
this.ticketsService.getNextId().pipe(
  switchMap(nextId => this.ticketsService.createTicket({ ...data, id: String(nextId) })),
  catchError(err => { /* manejo */ return of(null); }),
  finalize(() => { this.saving = false; this.cdr.markForCheck(); }),
  takeUntil(this.destroy$)
).subscribe(/* solo efectos de UI */);
```

- `switchMap` cancela la petición anterior si llega una nueva (útil en filtros)
- `catchError` dentro del pipe evita que un error rompa el stream; retorna `of(null)` para continuar
- `finalize` garantiza que el flag `loading`/`saving` se limpie siempre, incluso ante error
- `takeUntil(this.destroy$)` desuscribe automáticamente al destruir el componente

### Sincronización de filtros con query params (deep-linking)
La lista de tickets refleja en la URL todos los filtros activos, el orden y la página actual:

```
/tickets?search=login&status=ABIERTO&priority=ALTA&page=2&sort=updatedAt
```

Esto permite compartir una búsqueda específica, navegar con el botón atrás del navegador y refrescar sin perder el estado. El detalle preserva los query params al volver a la lista.

### Interceptors

| Interceptor | Responsabilidad |
|---|---|
| `BaseUrlInterceptor` | Prefija `http://localhost:3000` a todas las peticiones relativas |
| `ErrorInterceptor` | Captura errores HTTP, loguea y muestra un `MatSnackBar` con mensaje amigable |

---

## ⚖️ Trade-offs

### `ViewEncapsulation.None` vs `::ng-deep`
`None` convierte los estilos del componente en globales, lo que puede generar colisiones si dos componentes definen la misma clase. Se mitiga usando el selector raíz del componente como prefijo en todas las reglas (`.ticket-detail-card .mat-mdc-card-header`). La alternativa `::ng-deep` está deprecated desde Angular 14 y será removida en el futuro.

### `ChangeDetectionStrategy.OnPush` + `cdr.markForCheck()`
OnPush requiere llamar `markForCheck()` manualmente después de cada operación asíncrona fuera del `async pipe`. Aumenta levemente el boilerplate pero el beneficio de performance en listas grandes justifica el costo. Una alternativa más moderna sería migrar a `signals` (Angular 17+), que elimina la necesidad de `markForCheck()`.

### Estado local vs store global
Se eligió estado local en cada componente (sin NgRx ni ComponentStore) dado el alcance del proyecto. Es suficiente porque los componentes no comparten estado complejo entre sí. Si la app creciera con caché compartida de tickets, filtros persistentes entre navegaciones o actualizaciones en tiempo real, la migración a un store liviano con `BehaviorSubject` en el servicio o a `signals + computed` sería el siguiente paso natural.

### json-server como backend
Permite iterar rápido en frontend sin backend real. La desventaja es que no soporta queries complejas ni validaciones del lado del servidor, por lo que toda la lógica de filtrado vive en el cliente o en el servicio con params de URL que json-server interpreta parcialmente.

---

## 🔜 Próximos pasos

### Performance
- [ ] Migrar estado a **Angular Signals** (`signal`, `computed`, `effect`) para eliminar `markForCheck()` manual y tener reactividad más granular
- [ ] Implementar **virtual scrolling** (`CdkVirtualScrollViewport`) en la lista para manejar miles de tickets sin penalizar el DOM
- [ ] Agregar **caché en el servicio** con `shareReplay(1)` para evitar requests repetidos en navegaciones frecuentes

### UX / Features
- [ ] **Skeleton loaders** en lugar del spinner de bloqueo — mejor percepción de velocidad
- [ ] **Confirmación de borrado** con `MatDialog` antes de eliminar un ticket
- [ ] **Ordenamiento visual** en columnas de la tabla con `MatSort` y flechas de dirección
- [ ] **Filtros avanzados**: rango de fechas con `MatDatepicker`, filtro por responsable con autocomplete

### Calidad
- [ ] **Tests unitarios** con Jest: services (mock HTTP), componentes (TestBed + `fakeAsync`)
- [ ] **Tests e2e** con Cypress o Playwright: flujo crear → editar → comentar → volver a lista
- [ ] **Linting estricto**: habilitar reglas de `@angular-eslint` incluyendo `no-lifecycle-call` y `prefer-on-push-component-change-detection`

### Infraestructura
- [ ] Reemplazar json-server por un **backend real** (NestJS / Express) con autenticación JWT
- [ ] **Interceptor de auth**: adjuntar `Authorization: Bearer <token>` a todas las peticiones
- [ ] **CI/CD**: pipeline con GitHub Actions — lint → test → build → deploy a Vercel/Netlify
