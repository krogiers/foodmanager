export type Eenheid = 'G' | 'KG' | 'ML' | 'L' | 'ST'
export type AllergeenAanwezigheid = 'BEVAT' | 'KAN_BEVATTEN' | 'VRIJ_VAN'
export type Allergeen =
  | 'GLUTEN' | 'SCHAALDIEREN' | 'EIEREN' | 'VIS' | 'PINDA' | 'SOJA'
  | 'MELK' | 'NOTEN' | 'SELDERIJ' | 'MOSTERD' | 'SESAM'
  | 'SULFIET' | 'LUPINE' | 'WEEKDIEREN'

export interface VoedingswaardenResponse {
  energie: number
  eiwitten: number
  koolhydraten: number
  suikers: number
  vetten: number
  verzadigdVet: number
  vezels: number
  zout: number
}

export interface IngredientAllergeenResponse {
  allergeen: Allergeen
  aanwezigheid: AllergeenAanwezigheid
}

export interface IngredientResponse {
  id: string
  naam: string
  eenheid: Eenheid
  aankoopprijs: number | null
  categorie: string | null
  voedingswaarden: VoedingswaardenResponse | null
  allergenen: IngredientAllergeenResponse[]
}
