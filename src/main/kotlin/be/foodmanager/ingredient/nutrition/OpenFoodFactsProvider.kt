package be.foodmanager.ingredient.nutrition

import be.foodmanager.ingredient.Allergeen
import be.foodmanager.ingredient.AllergeenAanwezigheid
import be.foodmanager.ingredient.IngredientAllergeen
import be.foodmanager.ingredient.VoedingswaardePer100
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.math.BigDecimal

@Component
class OpenFoodFactsProvider(
    @Value("\${nutrition.providers.open-food-facts.base-url}") private val baseUrl: String,
    @Value("\${nutrition.providers.open-food-facts.search-url}") private val searchUrl: String
) : NutritionProvider {

    override val providerNaam = "OPEN_FOOD_FACTS"

    private val client = RestClient.builder()
        .defaultHeader("User-Agent", "FoodManager/1.0 (contact@foodmanager.be)")
        .build()

    override fun zoek(query: String): List<NutritionZoekResultaat> {
        val response = client.get()
            .uri("$searchUrl/search?q={q}&fields=code,product_name,brands&page_size=20", query)
            .retrieve()
            .body(OffSearchResponse::class.java)
            ?: return emptyList()

        return response.hits
            .filter { it.code != null && it.productName != null }
            .map { NutritionZoekResultaat(externeId = it.code!!, naam = it.productName!!, merk = it.brands) }
    }

    override fun haalDetail(externeId: String): NutritionDetail {
        val response = client.get()
            .uri("$baseUrl/api/v2/product/{id}?fields=product_name,nutriments,allergens_tags", externeId)
            .retrieve()
            .body(OffProductResponse::class.java)
            ?: throw IllegalStateException("Geen resultaat van Open Food Facts voor id: $externeId")

        val product = response.product
            ?: throw IllegalStateException("Product niet gevonden in Open Food Facts: $externeId")

        val n = product.nutriments ?: OffNutriments()

        return NutritionDetail(
            naam = product.productName ?: externeId,
            voedingswaarden = VoedingswaardePer100(
                energie = n.energieKcal100g ?: BigDecimal.ZERO,
                eiwitten = n.eiwitten100g ?: BigDecimal.ZERO,
                koolhydraten = n.koolhydraten100g ?: BigDecimal.ZERO,
                suikers = n.suikers100g ?: BigDecimal.ZERO,
                vetten = n.vetten100g ?: BigDecimal.ZERO,
                verzadigdVet = n.verzadigdVet100g ?: BigDecimal.ZERO,
                vezels = n.vezels100g ?: BigDecimal.ZERO,
                zout = n.zout100g ?: BigDecimal.ZERO
            ),
            allergenen = parseAllergenen(product.allergensTags)
        )
    }

    private fun parseAllergenen(tags: List<String>?): List<IngredientAllergeen> {
        if (tags.isNullOrEmpty()) return emptyList()

        return tags.mapNotNull { tag ->
            val aanwezigheid = when {
                tag.startsWith("en:may-contain:") || tag.contains("may-contain") -> AllergeenAanwezigheid.KAN_BEVATTEN
                else -> AllergeenAanwezigheid.BEVAT
            }
            val allergeenNaam = tag
                .removePrefix("en:may-contain:")
                .removePrefix("en:")
                .uppercase()
                .replace("-", "_")

            val allergeen = runCatching { Allergeen.valueOf(allergeenNaam) }.getOrNull()
            allergeen?.let { IngredientAllergeen(it, aanwezigheid) }
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffSearchResponse(val hits: List<OffSearchHit> = emptyList())

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffSearchHit(
        val code: String? = null,
        @JsonProperty("product_name") val productName: String? = null,
        val brands: String? = null
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffProductResponse(val product: OffProduct? = null)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffProduct(
        @JsonProperty("product_name") val productName: String? = null,
        val nutriments: OffNutriments? = null,
        @JsonProperty("allergens_tags") val allergensTags: List<String>? = null
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffNutriments(
        @JsonProperty("energy-kcal_100g") val energieKcal100g: BigDecimal? = null,
        @JsonProperty("proteins_100g") val eiwitten100g: BigDecimal? = null,
        @JsonProperty("carbohydrates_100g") val koolhydraten100g: BigDecimal? = null,
        @JsonProperty("sugars_100g") val suikers100g: BigDecimal? = null,
        @JsonProperty("fat_100g") val vetten100g: BigDecimal? = null,
        @JsonProperty("saturated-fat_100g") val verzadigdVet100g: BigDecimal? = null,
        @JsonProperty("fiber_100g") val vezels100g: BigDecimal? = null,
        @JsonProperty("salt_100g") val zout100g: BigDecimal? = null
    )
}
