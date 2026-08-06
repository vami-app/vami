# Atoms

Business-agnostic UI primitives. Atoms **must not** import molecules, organisms, templates, or features.

## Dependency rule

```
primitives → atoms → molecules → organisms → templates → features / app routes
```

- An atom may import `@/components/primitives/*`, `@/lib/utils`, icons, and tokens via Tailwind classes only.
- Prefer composing existing atoms before adding a new one.

## Adding an atom

1. Create `components/atoms/<name>.jsx` with a named export.
2. Use CVA for variants when the control has multiple visual states.
3. Add JSDoc `@typedef` for props (project uses JavaScript + JSDoc, not TypeScript).
4. Re-export from `components/atoms/index.js`.
5. Prefer semantic token classes (`bg-primary`, `text-text-muted`) over raw hex.

## JSDoc example

```jsx
/**
 * @typedef {{
 *   variant?: 'default' | 'outline' | 'ghost',
 *   size?: 'default' | 'sm' | 'icon',
 *   asChild?: boolean,
 *   className?: string,
 *   children?: import('react').ReactNode,
 * }} ButtonProps
 */

/** @param {ButtonProps} props */
export function Button({ variant = 'default', size = 'default', asChild = false, className, ...props }) {
  // ...
}
```

## Do not

- Put domain/product logic in atoms.
- Import from `@/features/*` or `@/modules/*`.
- Change visual recipes casually — UI/UX parity is required for refactors.
