# Theme Utilities

Single-class color utilities are defined in `src/index.css` under `@layer utilities`.
They map CSS custom properties that differ between light and dark mode to simple
classes like `bg-primary`, `text-primary`, etc.

## Available classes

Background: `bg-primary` `bg-secondary` `bg-accent` `bg-info` `bg-success` `bg-warning` `bg-danger` `bg-background` `bg-primary-soft`

Text: `text-primary` `text-secondary` `text-accent` `text-info` `text-success` `text-warning` `text-danger` `text-base-fg` `text-muted` `text-contrast`

Border: `border-primary` `border-secondary` `border-accent` `border-info` `border-success` `border-warning` `border-danger`

## Dark mode

Dark mode is toggled by adding the `dark` class to `<html>` (handled by `ThemeToggle`).
The CSS variables redeclare in `.dark` causing all utilities to adapt automatically.

## Example

```jsx
<button className="bg-primary text-contrast px-4 py-2 rounded">
  Order Now
</button>
```

No conditional classes needed; color will adapt to the active theme.
