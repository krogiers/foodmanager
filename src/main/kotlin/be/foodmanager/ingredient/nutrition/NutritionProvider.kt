package be.foodmanager.ingredient.nutrition

import be.foodmanager.ingredient.IngredientAllergeen
import be.foodmanager.ingredient.VoedingswaardePer100

interface NutritionProvider {
    val providerNaam: String

    fun zoek(
        query: String,
        pagina: Int = 0,
        paginaGrootte: Int = 20,
        merk: String? = null
    ): NutritionZoekPagina

    fun haalDetail(externeId: String): NutritionDetail
}

data class NutritionZoekResultaat(
    val externeId: String,
    val naam: String,
    val merk: String? = null,
    val heeftVoedingswaarden: Boolean = false,
    val heeftAllergenen: Boolean = false
)

data class NutritionZoekPagina(
    val resultaten: List<NutritionZoekResultaat>,
    val totaalAantal: Int,
    val pagina: Int,
    val paginaGrootte: Int,
    val totalePaginas: Int = if (paginaGrootte > 0) (totaalAantal + paginaGrootte - 1) / paginaGrootte else 0
)

data class NutritionDetail(
    val naam: String,
    val categorie: String? = null,
    val voedingswaarden: VoedingswaardePer100? = null,
    val allergenen: List<IngredientAllergeen> = emptyList()
)
