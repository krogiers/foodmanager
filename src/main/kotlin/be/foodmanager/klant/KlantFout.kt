package be.foodmanager.klant

import java.util.UUID

sealed class KlantFout {
    data class NietGevonden(val id: UUID) : KlantFout()
    data class HeeftActieveReservaties(val id: UUID) : KlantFout()
    data class ReedsGeanonimiseerd(val id: UUID) : KlantFout()
}
