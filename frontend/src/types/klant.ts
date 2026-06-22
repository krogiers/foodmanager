import type { Allergeen } from './ingredient'

export type Herkomst = 'MOND_TOT_MOND' | 'SOCIALE_MEDIA' | 'WEBSITE' | 'EVENT' | 'ANDERE'
export type VoorkeurContactwijze = 'EMAIL' | 'TELEFOON' | 'SMS' | 'WHATSAPP' | 'FACEBOOK' | 'MESSENGER' | 'INSTAGRAM'

export interface AdresResponse {
  straat: string
  huisnummer: string
  gemeente: string
  postcode: string
  land: string
}

export interface SpecialeEisResponse {
  id: string
  omschrijving: string
}

export interface KlantResponse {
  id: string
  voornaam: string | null
  familienaam: string
  volledigNaam: string
  email: string | null
  telefoon: string | null
  adres: AdresResponse | null
  herkomst: Herkomst | null
  herkomstToelichting: string | null
  voorkeurContactwijze: VoorkeurContactwijze
  allergenen: Allergeen[]
  specialeEisen: SpecialeEisResponse[]
  isGeanonimiseerd: boolean
  aangemaaktOp: string
}
