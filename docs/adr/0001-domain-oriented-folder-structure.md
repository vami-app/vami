# 1. Domain-Oriented Folder Structure

Date: 2026-07-31

## Context

Typical applications often organize code horizontally by technical layers (e.g., `controllers/`, `models/`, `routes/`, `services/`). While this works for simple applications, it can lead to tight coupling and scattered business logic as the application grows. When a feature changes, developers have to touch multiple directories. 
We need a structure that aligns with our business capabilities and allows us to easily find, maintain, and scale features independently, especially since we plan to support multiple applications (e.g., `web`, `api-gateway`).

## Decision

We have decided to adopt a domain-oriented folder structure. 
The repository will be structured around bounded contexts (domains) rather than technical layers. The initial layout consists of:

- `apps/`: Contains entry points for distinct applications (e.g., `web`, `api-gateway`).
- `domains/`: Contains business capabilities grouped by domain (e.g., `auth/`, `orders/`). Each domain has:
  - `core/`: Pure business logic.
  - `adapters/`: Infrastructure concerns like database models and queries.
  - `index.js`: The public API for the domain, acting as the only entry point for other domains or apps.
- `libs/`: Shared utilities and libraries.
- `docs/adr/`: Architecture Decision Records.

## Consequences

- **Pros**: 
  - Code related to a specific feature/domain is co-located, making it easier to navigate and maintain.
  - Clear boundaries between domains can be enforced through the `index.js` public API, preventing spaghetti dependencies.
  - Scaling development and extracting services becomes simpler.
- **Cons**: 
  - Might present a slight learning curve for developers accustomed to the traditional layered MVC structure.
  - Requires disciplined code reviews or tooling to ensure domain boundaries are respected (e.g., not directly importing from another domain's `adapters/`).
