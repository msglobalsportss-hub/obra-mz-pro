/**
 * Interfaces de Mappers para transformação de dados entre Domínio e DTOs.
 */

export interface IMapper<TDomain, TDTO> {
  toDTO(domain: TDomain): TDTO;
  toDomain(dto: TDTO): TDomain;
}
