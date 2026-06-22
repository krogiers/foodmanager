package be.foodmanager.ingredient

import java.util.UUID

sealed class IngredientFout {
    data class NietGevonden(val id: UUID) : IngredientFout()
    data class NaamBestaatAl(val naam: String) : IngredientFout()
    data class ProviderNietGevonden(val naam: String) : IngredientFout()
    data class ExterneProviderFout(val bericht: String) : IngredientFout()
}
