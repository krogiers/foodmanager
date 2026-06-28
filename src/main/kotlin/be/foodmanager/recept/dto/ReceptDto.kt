package be.foodmanager.recept.dto

import be.foodmanager.ingredient.Eenheid
import be.foodmanager.ingredient.dto.VoedingswaardenResponse
import be.foodmanager.recept.HoudbaarheidEenheid
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.util.UUID

enum class RegelType { INGREDIENT, RECEPT }

data class ReceptAanmakenRequest(
    @field:NotBlank val naam: String,
    val houdbaarheidWaarde: Int? = null,
    val houdbaarheidEenheid: HoudbaarheidEenheid? = null,
    val bereidingswijze: String? = null,
    val opmerkingen: String? = null,
    val regels: List<ReceptRegelRequest> = emptyList()
)

data class ReceptWijzigenRequest(
    @field:NotBlank val naam: String,
    val houdbaarheidWaarde: Int? = null,
    val houdbaarheidEenheid: HoudbaarheidEenheid? = null,
    val bereidingswijze: String? = null,
    val opmerkingen: String? = null,
    val regels: List<ReceptRegelRequest> = emptyList()
)

data class ReceptRegelRequest(
    @field:NotNull val type: RegelType,
    @field:NotNull @field:DecimalMin("0.0001") val hoeveelheid: BigDecimal,
    @field:NotNull val eenheid: Eenheid,
    val ingredientId: UUID? = null,
    val subReceptId: UUID? = null,
    val volgorde: Int = 0
)

data class ReceptResponse(
    val id: UUID,
    val naam: String,
    val regels: List<ReceptRegelResponse>,
    val houdbaarheid: HoudbaarheidsDuurResponse?,
    val voedingswaarden: VoedingswaardenResponse?,
    val bereidingswijze: String?,
    val opmerkingen: String?
)

data class ReceptSummaryResponse(
    val id: UUID,
    val naam: String,
    val houdbaarheid: HoudbaarheidsDuurResponse?,
    val aantalRegels: Int
)

data class ReceptRegelResponse(
    val id: UUID,
    val type: RegelType,
    val hoeveelheid: BigDecimal,
    val eenheid: Eenheid,
    val ingredient: IngredientRefResponse? = null,
    val subRecept: ReceptRefResponse? = null,
    val volgorde: Int
)

data class IngredientRefResponse(val id: UUID, val naam: String, val eenheid: Eenheid)

data class ReceptRefResponse(val id: UUID, val naam: String)

data class HoudbaarheidsDuurResponse(val waarde: Int, val eenheid: HoudbaarheidEenheid)
