# 1. Modular Monolith Architecture over Microservices

- **Status:** Accepted
- **Date:** 2026-07-28
- **Authors:** Vami Engineering Team

## Context

The Vami platform requires multi-product capabilities (multiple frontend applications sharing a single user identity, notification service, media service, atomic UI components, and global pagination conventions).

Microservices introduce premature distributed systems complexity (network latency, distributed transactions, complex local setups) while a naive monolith risks forming an unmaintainable "big ball of mud."

## Decision

We adopt a **Modular Monolith architecture inside an Nx monorepo**:
1. **Single Repository & Unified Trunk**: All applications, services, and libraries live in one source tree.
2. **Strict Module Boundaries**: Boundaries are enforced mechanically via `@nx/eslint-plugin/enforce-module-boundaries` rules (`scope:feature`, `scope:data-access`, `scope:domain`, `scope:util`, `scope:ui`).
3. **Registry Pattern**: Services and plugins register via `ServiceRegistry` and `ModuleRegistry`, enabling clean decoupled in-process event dispatch.
4. **Extraction Readiness**: Each domain service owns its schema and logic cleanly so it can be extracted into an independent microservice in the future with zero internal logic rewrite.

## Consequences

- **Positive:** Fast in-memory communication pre-launch, zero cloud cost during development, strict mechanical lint enforcement, single source of truth for identity and design tokens.
- **Negative:** Requires strict discipline not to bypass module boundaries (mitigated by ESLint rule enforcement).
