# ADR-0001: Modular monolith with event-driven workers

## Status

Accepted.

## Decision

Use a TypeScript modular monolith for transactional business domains, backed by PostgreSQL,
and event-driven background workers for external effects and long-running workflows.

## Consequences

- Cross-domain table mutation is prohibited.
- Domain services own invariants and state transitions.
- Finance/enrollment operations can retain strong transaction boundaries.
- Operational overhead is lower than a microservice-per-domain design.
- High-load boundaries can be extracted later behind existing contracts.
