package be.foodmanager.ingredient.nutrition

import be.foodmanager.ingredient.IngredientAllergeen
import be.foodmanager.ingredient.VoedingswaardePer100

interface NutritionProvider {
    val providerNaam: String

    fun zoek(query: String): List<NutritionZoekResultaat>
    fun haalDetail(externeId: String): NutritionDetail
}

data class NutritionZoekResultaat(
    val externeId: String,
    val naam: String,
    val merk: String? = null
)

data class NutritionDetail(
    val naam: String,
    val voedingswaarden: VoedingswaardePer100,
    val allergenen: List<IngredientAllergeen> = emptyList()
)
