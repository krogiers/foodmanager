package be.foodmanager.label

import java.util.UUID

sealed class LabelFout {
    data class NietGevonden(val id: UUID)  : LabelFout()
    data class NaamBestaatAl(val naam: String) : LabelFout()
    data class ReceptNietGevonden(val id: UUID) : LabelFout()
}
