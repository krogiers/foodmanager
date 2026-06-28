import type { Eenheid, VoedingswaardenResponse } from './ingredient'

export type HoudbaarheidEenheid = 'DAGEN' | 'WEKEN' | 'MAANDEN'
export type RegelType = 'INGREDIENT' | 'RECEPT'

export interface HoudbaarheidsDuurResponse {
  waarde: number
  eenheid: HoudbaarheidEenheid
}

export interface IngredientRefResponse {
  id: string
  naam: string
  eenheid: Eenheid
}

export interface ReceptRefResponse {
  id: string
  naam: string
}

export interface ReceptRegelResponse {
  id: string
  type: RegelType
  hoeveelheid: number
  eenheid: Eenheid
  ingredient?: IngredientRefResponse
  subRecept?: ReceptRefResponse
  volgorde: number
}

export interface ReceptResponse {
  id: string
  naam: string
  regels: ReceptRegelResponse[]
  houdbaarheid: HoudbaarheidsDuurResponse | null
  voedingswaarden: VoedingswaardenResponse | null
  bereidingswijze: string | null
  opmerkingen: string | null
}

export interface ReceptSummaryResponse {
  id: string
  naam: string
  houdbaarheid: HoudbaarheidsDuurResponse | null
  aantalRegels: number
}
