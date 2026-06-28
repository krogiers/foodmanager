package be.foodmanager.recept

import be.foodmanager.ingredient.Eenheid
import be.foodmanager.ingredient.Ingredient
import be.foodmanager.ingredient.IngredietenTable
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import java.math.BigDecimal
import java.util.UUID

enum class HoudbaarheidEenheid { DAGEN, WEKEN, MAANDEN }

data class HoudbaarheidsDuur(val waarde: Int, val eenheid: HoudbaarheidEenheid)

sealed class ReceptComponent {
    data class IngredientComponent(val ingredient: Ingredient) : ReceptComponent()
    data class SubReceptComponent(val recept: Recept) : ReceptComponent()
}

data class ReceptRegel(
    val id: UUID = UUID.randomUUID(),
    val hoeveelheid: BigDecimal,
    val eenheid: Eenheid,
    val component: ReceptComponent,
    val volgorde: Int = 0
)

data class Recept(
    val id: UUID = UUID.randomUUID(),
    val naam: String,
    val regels: List<ReceptRegel> = emptyList(),
    val houdbaarheid: HoudbaarheidsDuur? = null,
    val bereidingswijze: String? = null,
    val opmerkingen: String? = null
)

object ReceptenTable : Table("recepten") {
    val id = uuid("id")
    val naam = varchar("naam", 255).uniqueIndex()
    val houdbaarheidWaarde = integer("houdbaarheid_waarde").nullable()
    val houdbaarheidEenheid = enumerationByName<HoudbaarheidEenheid>("houdbaarheid_eenheid", 20).nullable()
    val bereidingswijze = text("bereidingswijze").nullable()
    val opmerkingen = text("opmerkingen").nullable()
    override val primaryKey = PrimaryKey(id)
}

object ReceptRegelTable : Table("recept_regels") {
    val id = uuid("id")
    val receptId = uuid("recept_id").references(ReceptenTable.id, onDelete = ReferenceOption.CASCADE)
    val hoeveelheid = decimal("hoeveelheid", 10, 4)
    val eenheid = enumerationByName<Eenheid>("eenheid", 10)
    val ingredientId = uuid("ingredient_id").references(IngredietenTable.id, onDelete = ReferenceOption.RESTRICT).nullable()
    val subReceptId = uuid("sub_recept_id").references(ReceptenTable.id, onDelete = ReferenceOption.RESTRICT).nullable()
    val volgorde = integer("volgorde").default(0)
    override val primaryKey = PrimaryKey(id)
}
