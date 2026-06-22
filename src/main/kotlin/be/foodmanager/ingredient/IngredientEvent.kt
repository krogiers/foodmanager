package be.foodmanager.ingredient

import java.util.UUID

sealed class IngredientEvent {
    data class Aangemaakt(val ingredient: Ingredient) : IngredientEvent()
    data class Gewijzigd(val ingredient: Ingredient) : IngredientEvent()
    data class Verwijderd(val id: UUID) : IngredientEvent()
}
