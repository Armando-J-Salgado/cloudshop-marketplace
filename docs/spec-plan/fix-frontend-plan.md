# Fix: Agregar RoleProvider en main.tsx

## Problema
El error `useRole must be used within a RoleProvider` ocurría porque el componente `RoleSwitcher` (usado en `AuthLayout`, `ShopLayout`, y `AdminLayout`) intentaba acceder al contexto de rol mediante el hook `useRole()`, pero el proveedor `RoleProvider` no estaba presente en el árbol de componentes.

## Causa Raíz
El archivo `frontend/src/main.tsx` solo incluía `AuthProvider` envolviendo al `RouterProvider`, pero faltaba `RoleProvider`. Los layouts que usan `RoleSwitcher` no tenían acceso al contexto porque no estaban envueltos por el proveedor correspondiente.

## Solución Implementada
Se agregó `RoleProvider` en `main.tsx` para envolver la aplicación completa, asegurando que todos los componentes hijos tengan acceso al contexto de rol.

### Archivo Modificado
- `frontend/src/main.tsx`

### Cambios Realizados
```tsx
// Antes:
<AuthProvider>
  <RouterProvider router={router} />
</AuthProvider>

// Después:
<AuthProvider>
  <RoleProvider>
    <RouterProvider router={router} />
  </RoleProvider>
</AuthProvider>
```

## Verificación
- **Build exitoso**: `npm run build` completó sin errores
- **Tipo de cambio**: Configuración de contexto (no requiere cambios en componentes individuales)
- **Impacto**: Mínimo - solo se modifica el punto de entrada de la aplicación

## Notas Adicionales
- Este fix es necesario antes de implementar la Fase 4 (Frontend wiring real)
- El orden de los proveedores es importante: `AuthProvider` → `RoleProvider` → `RouterProvider`
- No se requieren cambios en los layouts ni en `RoleSwitcher`
