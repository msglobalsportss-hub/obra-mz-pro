# ADR-001: Limites e Camadas do Módulo de Inventário

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto
O ERP ObraMZ necessita de um módulo de Inventário escalável, desacoplado e resiliente que possa servir tanto a aplicação Web atual como futuras APIs, aplicações móveis e processos automáticos.

## Decisão
Adotar uma arquitetura baseada em Clean Architecture e Domain-Driven Design (DDD), dividida nas seguintes camadas estritas:
1. `core`: Contém as regras de negócio puras, contratos, políticas, validações, tipos de localização e o Inventory Engine. É 100% puro em TypeScript e nunca depende de React, UI ou persistência.
2. `application`: Camada de orquestração de casos de uso (Commands, Queries, DTOs, Mappers).
3. `features`: Organização modular por funcionalidade (Dashboard, Movimentos, Reservas, Transferências, etc.).
4. `index.ts`: Ponto de entrada público único.

## Consequências
- **Positivas**: Isolamento total do domínio, facilidade de testes unitários e reutilização futura em qualquer runtime JavaScript/TypeScript.
- **Negativas**: Exige manutenção rigorosa das fronteiras e proibição de importações diretas do `core` por outros módulos externos.
