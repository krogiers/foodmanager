package be.foodmanager.recept

import java.util.UUID

sealed class ReceptFout {
    data class NietGevonden(val id: UUID) : ReceptFout()
    data class NaamBestaatAl(val naam: String) : ReceptFout()
    data class CirkelReferentie(val subreceptNaam: String) : ReceptFout()
    data class InGebruik(val naam: String) : ReceptFout()
    data class IngredientNietGevonden(val id: UUID) : ReceptFout()
    data class SubReceptNietGevonden(val id: UUID) : ReceptFout()
}
