# Radhey Metal Alloys LLP — FAANG-Grade Web Application

A scalable, high-performance web application serving both the public marketing site and the internal administrative portal for Radhey Metal Alloys LLP. 

Built with Next.js 16 (App Router), React 19, and Tailwind CSS v4, this repository utilizes an Enterprise-grade Feature Module architecture combined with Atomic Design patterns.

*Note: The NPM package name is `smalloys` to distinguish the repo codebase from the product brand.*

## Architecture Overview

This project adheres to a strict "FAANG-grade" enterprise structure.

1. **`app/`**: Thin routing layer. Only route definitions, layouts, and page shells that orchestrate data fetching and render colocated feature components.
2. **`components/`**: The shared Atomic Design UI Kit.
   - `primitives/`: Unstyled behavior wrappers (e.g., Radix Slot).
   - `atoms/`: Smallest building blocks (Button, Input, Text, Badge).
   - `molecules/`: Composed atoms (FormField, Tabs, Pagination).
   - `organisms/`: Complex distinct UI sections (Navbar, Footer, ConfirmModal).
   - `templates/`: Page layouts with slots for content.
3. **`features/`**: Route-colocated UI components containing feature-specific logic. 
   - Split into `public/` and `admin/`.
4. **`modules/`**: The domain layer (Services, Models, Actions). This is the single source of truth for business logic.
5. **`styles/tokens/`**: Three-layer design token system (Primitives → Semantic → Component) mapped to Tailwind via CSS variables.

### Parity Rule (Crucial)
This codebase relies on strict UI/UX parity for components. **Do not** redesign or restyle buttons, inputs, forms, layouts, or fonts outside of the token layers without explicit permission. The visual output must remain consistent with the original production build.

## How to add a new Component

1. Identify its atomic level (Atom, Molecule, Organism, or Template).
2. If it's a shared generic UI piece, place it in `components/[level]/`.
3. If it's highly specific to a route or business feature, place it in `features/[public|admin]/[feature_name]/`.
4. Import and use **only** tokens from the `styles/tokens/*` definitions for styling. Do not hardcode arbitrary spacing or hex colors.
5. Provide comprehensive JSDoc annotations for props.

## Technology Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 + CVA + Radix Primitives
- **Data/DB**: Mongoose (MongoDB)
- **Forms & State**: React DOM Hooks, standard React context.
