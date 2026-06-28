package be.foodmanager.label

import java.util.UUID

sealed class LabelEvent {
    data class Aangemaakt(val sjabloon: Labelsjabloon) : LabelEvent()
    data class Gewijzigd(val sjabloon: Labelsjabloon)  : LabelEvent()
    data class Verwijderd(val id: UUID)                : LabelEvent()
}
