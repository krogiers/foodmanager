package be.foodmanager.recept

import java.util.UUID

sealed class ReceptEvent {
    data class Aangemaakt(val recept: Recept) : ReceptEvent()
    data class Gewijzigd(val recept: Recept) : ReceptEvent()
    data class Verwijderd(val id: UUID) : ReceptEvent()
}
