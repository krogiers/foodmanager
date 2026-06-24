package be.foodmanager.ingredient.dto

import be.foodmanager.ingredient.*
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.util.UUID

data class IngredientAanmakenRequest(
    @field:NotBlank val naam: String,
    @field:NotNull val eenheid: Eenheid,
    val aankoopprijs: BigDecimal? = null,
    val categorie: String? = null,
    @field:Valid val voedingswaarden: VoedingswaardenRequest? = null,
    val allergenen: List<IngredientAllergeenRequest> = emptyList()
)

data class IngredientWijzigenRequest(
    @field:NotBlank val naam: String,
    @field:NotNull val eenheid: Eenheid,
    val aankoopprijs: BigDecimal? = null,
    val categorie: String? = null,
    @field:Valid val voedingswaarden: VoedingswaardenRequest? = null,
    val allergenen: List<IngredientAllergeenRequest> = emptyList()
)

data class VoedingswaardenRequest(
    @field:NotNull val energie: BigDecimal,
    @field:NotNull val eiwitten: BigDecimal,
    @field:NotNull val koolhydraten: BigDecimal,
    @field:NotNull val suikers: BigDecimal,
    @field:NotNull val vetten: BigDecimal,
    @field:NotNull val verzadigdVet: BigDecimal,
    @field:NotNull val vezels: BigDecimal,
    @field:NotNull val zout: BigDecimal
)

data class IngredientAllergeenRequest(
    @field:NotNull val allergeen: Allergeen,
    @field:NotNull val aanwezigheid: AllergeenAanwezigheid
)

data class IngredientResponse(
    val id: UUID,
    val naam: String,
    val eenheid: Eenheid,
    val aankoopprijs: BigDecimal?,
    val categorie: String?,
    val voedingswaarden: VoedingswaardenResponse?,
    val allergenen: List<IngredientAllergeenResponse>
)

data class VoedingswaardenResponse(
    val energie: BigDecimal,
    val eiwitten: BigDecimal,
    val koolhydraten: BigDecimal,
    val suikers: BigDecimal,
    val vetten: BigDecimal,
    val verzadigdVet: BigDecimal,
    val vezels: BigDecimal,
    val zout: BigDecimal
)

data class IngredientAllergeenResponse(
    val allergeen: Allergeen,
    val aanwezigheid: AllergeenAanwezigheid
)

data class NutritionZoekRequest(@field:NotBlank val query: String)
