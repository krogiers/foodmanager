package be.foodmanager.klant

import java.util.UUID

sealed class KlantEvent {
    data class Aangemaakt(val klant: Klant) : KlantEvent()
    data class Gewijzigd(val klant: Klant) : KlantEvent()
    data class Geanonimiseerd(val id: UUID) : KlantEvent()
}
