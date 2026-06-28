package be.foodmanager.ingredient

import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import java.math.BigDecimal
import java.util.UUID

object IngredietenTable : Table("ingredienten") {
    val id = uuid("id")
    val naam = varchar("naam", 255).uniqueIndex()
    val eenheid = enumerationByName<Eenheid>("eenheid", 10)
    val aankoopprijs = decimal("aankoopprijs", 10, 4).nullable()
    val energieKcal = decimal("energie_kcal", 8, 2).nullable()
    val eiwitten = decimal("eiwitten_g", 8, 2).nullable()
    val koolhydraten = decimal("koolhydraten_g", 8, 2).nullable()
    val suikers = decimal("suikers_g", 8, 2).nullable()
    val vetten = decimal("vetten_g", 8, 2).nullable()
    val verzadigdVet = decimal("verzadigd_vet_g", 8, 2).nullable()
    val vezels = decimal("vezels_g", 8, 2).nullable()
    val zout = decimal("zout_g", 8, 2).nullable()
    override val primaryKey = PrimaryKey(id)
}

object IngredientAllergeenTable : Table("ingredient_allergenen") {
    val ingredientId = uuid("ingredient_id").references(IngredietenTable.id, onDelete = ReferenceOption.CASCADE)
    val allergeen = enumerationByName<Allergeen>("allergeen", 50)
    val aanwezigheid = enumerationByName<AllergeenAanwezigheid>("aanwezigheid", 20)
    override val primaryKey = PrimaryKey(ingredientId, allergeen)
}

data class Ingredient(
    val id: UUID = UUID.randomUUID(),
    val naam: String,
    val eenheid: Eenheid,
    val aankoopprijs: BigDecimal? = null,
    val voedingswaarden: VoedingswaardePer100? = null,
    val allergenen: List<IngredientAllergeen> = emptyList()
)

data class VoedingswaardePer100(
    val energie: BigDecimal,
    val eiwitten: BigDecimal,
    val koolhydraten: BigDecimal,
    val suikers: BigDecimal,
    val vetten: BigDecimal,
    val verzadigdVet: BigDecimal,
    val vezels: BigDecimal,
    val zout: BigDecimal
)

data class IngredientAllergeen(
    val allergeen: Allergeen,
    val aanwezigheid: AllergeenAanwezigheid
)
