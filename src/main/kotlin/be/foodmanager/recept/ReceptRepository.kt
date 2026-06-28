package be.foodmanager.recept

import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.Eenheid
import be.foodmanager.ingredient.Ingredient
import be.foodmanager.ingredient.IngredietenTable
import be.foodmanager.ingredient.VoedingswaardePer100
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.neq
import org.jetbrains.exposed.sql.statements.UpdateBuilder
import org.springframework.stereotype.Repository
import java.util.UUID

data class ReceptListItem(
    val id: UUID,
    val naam: String,
    val houdbaarheid: HoudbaarheidsDuur?,
    val aantalRegels: Int
)

@Repository
class ReceptRepository {

    fun findPaged(naam: String? = null, pageRequest: PageRequest): PagedResponse<ReceptListItem> {
        val sortOrder = if (pageRequest.sortDir == "DESC") SortOrder.DESC else SortOrder.ASC

        fun baseQuery() = if (naam != null)
            ReceptenTable.selectAll().where { ReceptenTable.naam.lowerCase() like "%${naam.lowercase()}%" }
        else
            ReceptenTable.selectAll()

        val total = baseQuery().count()
        val rows = baseQuery()
            .orderBy(ReceptenTable.naam to sortOrder)
            .limit(pageRequest.size).offset(pageRequest.offset)
            .toList()

        val ids = rows.map { it[ReceptenTable.id] }
        val aantallenMap = if (ids.isEmpty()) emptyMap() else
            ReceptRegelTable
                .select(ReceptRegelTable.receptId, ReceptRegelTable.id.count())
                .where { ReceptRegelTable.receptId inList ids }
                .groupBy(ReceptRegelTable.receptId)
                .associate { it[ReceptRegelTable.receptId] to it[ReceptRegelTable.id.count()].toInt() }

        val content = rows.map { row ->
            ReceptListItem(
                id = row[ReceptenTable.id],
                naam = row[ReceptenTable.naam],
                houdbaarheid = row.houdbaarheidDuur(),
                aantalRegels = aantallenMap[row[ReceptenTable.id]] ?: 0
            )
        }
        return PagedResponse(content, total, pageRequest.totalPages(total), pageRequest.page, pageRequest.size)
    }

    fun findById(id: UUID): Recept? {
        val row = ReceptenTable.selectAll().where { ReceptenTable.id eq id }.singleOrNull() ?: return null
        return Recept(
            id = row[ReceptenTable.id],
            naam = row[ReceptenTable.naam],
            houdbaarheid = row.houdbaarheidDuur(),
            bereidingswijze = row[ReceptenTable.bereidingswijze],
            opmerkingen = row[ReceptenTable.opmerkingen],
            regels = loadRegels(id)
        )
    }

    fun findAlleNamen(): List<Pair<UUID, String>> =
        ReceptenTable.select(ReceptenTable.id, ReceptenTable.naam)
            .orderBy(ReceptenTable.naam to SortOrder.ASC)
            .map { it[ReceptenTable.id] to it[ReceptenTable.naam] }

    fun existsByNaamIgnoreCase(naam: String): Boolean =
        ReceptenTable.selectAll()
            .where { ReceptenTable.naam.lowerCase() eq naam.lowercase() }
            .count() > 0

    fun existsByNaamIgnoreCaseAndIdNot(naam: String, id: UUID): Boolean =
        ReceptenTable.selectAll()
            .where { (ReceptenTable.naam.lowerCase() eq naam.lowercase()) and (ReceptenTable.id neq id) }
            .count() > 0

    fun existsById(id: UUID): Boolean =
        ReceptenTable.selectAll().where { ReceptenTable.id eq id }.count() > 0

    fun isInGebruik(id: UUID): Boolean =
        ReceptRegelTable.selectAll().where { ReceptRegelTable.subReceptId eq id }.count() > 0

    fun save(recept: Recept): Recept {
        if (existsById(recept.id)) {
            ReceptenTable.update({ ReceptenTable.id eq recept.id }) { it.vulIn(recept) }
        } else {
            ReceptenTable.insert { it[id] = recept.id; it.vulIn(recept) }
        }
        ReceptRegelTable.deleteWhere { receptId eq recept.id }
        recept.regels.forEachIndexed { index, regel ->
            ReceptRegelTable.insert {
                it[id] = regel.id
                it[receptId] = recept.id
                it[hoeveelheid] = regel.hoeveelheid
                it[eenheid] = regel.eenheid
                it[volgorde] = index
                when (val c = regel.component) {
                    is ReceptComponent.IngredientComponent -> {
                        it[ingredientId] = c.ingredient.id
                        it[subReceptId] = null
                    }
                    is ReceptComponent.SubReceptComponent -> {
                        it[ingredientId] = null
                        it[subReceptId] = c.recept.id
                    }
                }
            }
        }
        return recept
    }

    fun deleteById(id: UUID) {
        ReceptenTable.deleteWhere { ReceptenTable.id eq id }
    }

    private fun loadRegels(receptId: UUID): List<ReceptRegel> {
        val regelRows = ReceptRegelTable.selectAll()
            .where { ReceptRegelTable.receptId eq receptId }
            .orderBy(ReceptRegelTable.volgorde to SortOrder.ASC)
            .toList()

        val ingredientIds = regelRows.mapNotNull { it[ReceptRegelTable.ingredientId] }
        val ingredientenMap = if (ingredientIds.isEmpty()) emptyMap() else
            IngredietenTable.selectAll()
                .where { IngredietenTable.id inList ingredientIds }
                .associate { row ->
                    val heeftVw = row[IngredietenTable.energieKcal] != null
                    row[IngredietenTable.id] to Ingredient(
                        id = row[IngredietenTable.id],
                        naam = row[IngredietenTable.naam],
                        eenheid = row[IngredietenTable.eenheid],
                        aankoopprijs = row[IngredietenTable.aankoopprijs],
                        voedingswaarden = if (heeftVw) VoedingswaardePer100(
                            energie = row[IngredietenTable.energieKcal]!!,
                            eiwitten = row[IngredietenTable.eiwitten]!!,
                            koolhydraten = row[IngredietenTable.koolhydraten]!!,
                            suikers = row[IngredietenTable.suikers]!!,
                            vetten = row[IngredietenTable.vetten]!!,
                            verzadigdVet = row[IngredietenTable.verzadigdVet]!!,
                            vezels = row[IngredietenTable.vezels]!!,
                            zout = row[IngredietenTable.zout]!!
                        ) else null,
                        allergenen = emptyList()
                    )
                }

        return regelRows.map { row ->
            val ingId = row[ReceptRegelTable.ingredientId]
            val srId = row[ReceptRegelTable.subReceptId]
            val component: ReceptComponent = when {
                ingId != null -> ReceptComponent.IngredientComponent(
                    ingredientenMap[ingId]
                        ?: throw IllegalStateException("Ingredient niet gevonden: $ingId")
                )
                srId != null -> ReceptComponent.SubReceptComponent(
                    findById(srId) ?: throw IllegalStateException("Subrecept niet gevonden: $srId")
                )
                else -> throw IllegalStateException("ReceptRegel zonder component: ${row[ReceptRegelTable.id]}")
            }
            ReceptRegel(
                id = row[ReceptRegelTable.id],
                hoeveelheid = row[ReceptRegelTable.hoeveelheid],
                eenheid = row[ReceptRegelTable.eenheid],
                component = component,
                volgorde = row[ReceptRegelTable.volgorde]
            )
        }
    }

    private fun UpdateBuilder<*>.vulIn(recept: Recept) {
        this[ReceptenTable.naam] = recept.naam
        this[ReceptenTable.houdbaarheidWaarde] = recept.houdbaarheid?.waarde
        this[ReceptenTable.houdbaarheidEenheid] = recept.houdbaarheid?.eenheid
        this[ReceptenTable.bereidingswijze] = recept.bereidingswijze
        this[ReceptenTable.opmerkingen] = recept.opmerkingen
    }

    private fun ResultRow.houdbaarheidDuur(): HoudbaarheidsDuur? {
        val waarde = this[ReceptenTable.houdbaarheidWaarde] ?: return null
        val eenheid = this[ReceptenTable.houdbaarheidEenheid] ?: return null
        return HoudbaarheidsDuur(waarde, eenheid)
    }
}
