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

    override fun zoek(query: String, pagina: Int, paginaGrootte: Int, merk: String?): NutritionZoekPagina {
        val apiPagina = pagina + 1 // OpenFoodFacts is 1-indexed
        val volleQuery = if (!merk.isNullOrBlank()) "$query $merk" else query

        val response = client.get()
            .uri(
                "$searchUrl/search?q={q}&fields=code,product_name,product_name_nl,brands,completeness,allergens_tags&page_size=$paginaGrootte&page=$apiPagina&sort_by=unique_scans_n",
                volleQuery
            )
            .retrieve()
            .body(OffSearchResponse::class.java)
            ?: return NutritionZoekPagina(emptyList(), 0, pagina, paginaGrootte)

        val resultaten = response.hits
            .filter { it.code != null && (it.productNameNl != null || it.productName != null) }
            .map {
                NutritionZoekResultaat(
                    externeId = it.code!!,
                    naam = it.productNameNl ?: it.productName!!,
                    merk = it.brands?.joinToString(", "),
                    heeftVoedingswaarden = (it.completeness ?: 0.0) >= 0.4,
                    heeftAllergenen = it.allergensTags?.isNotEmpty() == true
                )
            }

        return NutritionZoekPagina(
            resultaten = resultaten,
            totaalAantal = response.count ?: resultaten.size,
            pagina = pagina,
            paginaGrootte = paginaGrootte
        )
    }

    override fun haalDetail(externeId: String): NutritionDetail {
        val response = client.get()
            .uri("$baseUrl/api/v2/product/{id}?fields=product_name,product_name_nl,nutriments,allergens_tags", externeId)
            .retrieve()
            .body(OffProductResponse::class.java)
            ?: throw IllegalStateException("Geen resultaat van Open Food Facts voor id: $externeId")

        val product = response.product
            ?: throw IllegalStateException("Product niet gevonden in Open Food Facts: $externeId")

        val n = product.nutriments

        return NutritionDetail(
            naam = product.productNameNl ?: product.productName ?: externeId,
            voedingswaarden = if (n?.energieKcal100g != null) VoedingswaardePer100(
                energie = n.energieKcal100g,
                eiwitten = n.eiwitten100g ?: BigDecimal.ZERO,
                koolhydraten = n.koolhydraten100g ?: BigDecimal.ZERO,
                suikers = n.suikers100g ?: BigDecimal.ZERO,
                vetten = n.vetten100g ?: BigDecimal.ZERO,
                verzadigdVet = n.verzadigdVet100g ?: BigDecimal.ZERO,
                vezels = n.vezels100g ?: BigDecimal.ZERO,
                zout = n.zout100g ?: BigDecimal.ZERO
            ) else null,
            allergenen = parseAllergenen(product.allergensTags)
        )
    }

    private fun parseAllergenen(tags: List<String>?): List<IngredientAllergeen> {
        if (tags.isNullOrEmpty()) return emptyList()
        return tags.mapNotNull { tag ->
            val kanBevatten = tag.startsWith("en:may-contain:") || tag.contains("may-contain")
            val aanwezigheid = if (kanBevatten) AllergeenAanwezigheid.KAN_BEVATTEN else AllergeenAanwezigheid.BEVAT
            val sleutel = tag
                .removePrefix("en:may-contain:")
                .removePrefix("en:")
                .lowercase()
            OFF_ALLERGEEN_MAP[sleutel]?.let { IngredientAllergeen(it, aanwezigheid) }
        }
    }

    companion object {
        private val OFF_ALLERGEEN_MAP = mapOf(
            "gluten" to Allergeen.GLUTEN,
            "wheat" to Allergeen.GLUTEN,
            "rye" to Allergeen.GLUTEN,
            "barley" to Allergeen.GLUTEN,
            "oats" to Allergeen.GLUTEN,
            "spelt" to Allergeen.GLUTEN,
            "crustaceans" to Allergeen.SCHAALDIEREN,
            "crustacean" to Allergeen.SCHAALDIEREN,
            "eggs" to Allergeen.EIEREN,
            "egg" to Allergeen.EIEREN,
            "fish" to Allergeen.VIS,
            "peanuts" to Allergeen.PINDA,
            "peanut" to Allergeen.PINDA,
            "soybeans" to Allergeen.SOJA,
            "soybean" to Allergeen.SOJA,
            "soy" to Allergeen.SOJA,
            "soya" to Allergeen.SOJA,
            "milk" to Allergeen.MELK,
            "dairy" to Allergeen.MELK,
            "nuts" to Allergeen.NOTEN,
            "tree-nuts" to Allergeen.NOTEN,
            "celery" to Allergeen.SELDERIJ,
            "mustard" to Allergeen.MOSTERD,
            "sesame" to Allergeen.SESAM,
            "sesame-seeds" to Allergeen.SESAM,
            "sesame-seed" to Allergeen.SESAM,
            "sulphur-dioxide-and-sulphites" to Allergeen.SULFIET,
            "sulphites" to Allergeen.SULFIET,
            "sulfites" to Allergeen.SULFIET,
            "lupin" to Allergeen.LUPINE,
            "lupine" to Allergeen.LUPINE,
            "molluscs" to Allergeen.WEEKDIEREN,
            "molluscs-and-mollusc-products" to Allergeen.WEEKDIEREN,
            "mollusks" to Allergeen.WEEKDIEREN,
        )
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffSearchResponse(val hits: List<OffSearchHit> = emptyList(), val count: Int? = null)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffSearchHit(
        val code: String? = null,
        @JsonProperty("product_name") val productName: String? = null,
        @JsonProperty("product_name_nl") val productNameNl: String? = null,
        val brands: List<String>? = null,
        val completeness: Double? = null,
        @JsonProperty("allergens_tags") val allergensTags: List<String>? = null
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffProductResponse(val product: OffProduct? = null)

    @JsonIgnoreProperties(ignoreUnknown = true)
    data class OffProduct(
        @JsonProperty("product_name") val productName: String? = null,
        @JsonProperty("product_name_nl") val productNameNl: String? = null,
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
