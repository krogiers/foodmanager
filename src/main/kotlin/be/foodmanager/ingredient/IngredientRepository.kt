package be.foodmanager.ingredient

import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.neq
import org.jetbrains.exposed.sql.statements.UpdateBuilder
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class IngredientRepository {

    fun findPaged(naam: String? = null, pageRequest: PageRequest): PagedResponse<Ingredient> {
        val sortOrder = if (pageRequest.sortDir == "DESC") SortOrder.DESC else SortOrder.ASC

        fun baseQuery() = if (naam != null)
            IngredietenTable.selectAll().where { IngredietenTable.naam.lowerCase() like "%${naam.lowercase()}%" }
        else
            IngredietenTable.selectAll()

        val total = baseQuery().count()
        val rows = baseQuery()
            .orderBy(IngredietenTable.naam to sortOrder)
            .limit(pageRequest.size).offset(pageRequest.offset)
            .toList()
        val ids = rows.map { it[IngredietenTable.id] }
        val allergenenMap = allergenenVoorIds(ids)
        val content = rows.map { it.naarDomein(allergenenMap[it[IngredietenTable.id]] ?: emptyList()) }
        return PagedResponse(content, total, pageRequest.totalPages(total), pageRequest.page, pageRequest.size)
    }

    fun findById(id: UUID): Ingredient? =
        IngredietenTable.selectAll()
            .where { IngredietenTable.id eq id }
            .singleOrNull()
            ?.naarDomein(allergenenVoor(id))

    fun existsByNaamIgnoreCase(naam: String): Boolean =
        IngredietenTable.selectAll()
            .where { IngredietenTable.naam.lowerCase() eq naam.lowercase() }
            .count() > 0

    fun existsByNaamIgnoreCaseAndIdNot(naam: String, id: UUID): Boolean =
        IngredietenTable.selectAll()
            .where {
                (IngredietenTable.naam.lowerCase() eq naam.lowercase()) and
                (IngredietenTable.id neq id)
            }
            .count() > 0

    fun existsById(id: UUID): Boolean =
        IngredietenTable.selectAll()
            .where { IngredietenTable.id eq id }
            .count() > 0

    fun save(ingredient: Ingredient): Ingredient {
        if (existsById(ingredient.id)) {
            IngredietenTable.update({ IngredietenTable.id eq ingredient.id }) { row ->
                row.vulIn(ingredient)
            }
        } else {
            IngredietenTable.insert { row ->
                row[id] = ingredient.id
                row.vulIn(ingredient)
            }
        }
        IngredientAllergeenTable.deleteWhere { ingredientId eq ingredient.id }
        ingredient.allergenen.forEach { a ->
            IngredientAllergeenTable.insert {
                it[ingredientId] = ingredient.id
                it[allergeen] = a.allergeen
                it[aanwezigheid] = a.aanwezigheid
            }
        }
        return ingredient
    }

    fun deleteById(id: UUID) {
        IngredietenTable.deleteWhere { IngredietenTable.id eq id }
    }

    fun findAllergenenVoorIds(ids: List<UUID>): Map<UUID, List<IngredientAllergeen>> =
        allergenenVoorIds(ids)

    private fun allergenenVoor(id: UUID): List<IngredientAllergeen> =
        IngredientAllergeenTable.selectAll()
            .where { IngredientAllergeenTable.ingredientId eq id }
            .map {
                IngredientAllergeen(
                    allergeen = it[IngredientAllergeenTable.allergeen],
                    aanwezigheid = it[IngredientAllergeenTable.aanwezigheid]
                )
            }

    private fun alleAllergenen(): Map<UUID, List<IngredientAllergeen>> =
        IngredientAllergeenTable.selectAll()
            .groupBy({ it[IngredientAllergeenTable.ingredientId] }) {
                IngredientAllergeen(
                    allergeen = it[IngredientAllergeenTable.allergeen],
                    aanwezigheid = it[IngredientAllergeenTable.aanwezigheid]
                )
            }

    private fun allergenenVoorIds(ids: List<UUID>): Map<UUID, List<IngredientAllergeen>> =
        if (ids.isEmpty()) emptyMap()
        else IngredientAllergeenTable.selectAll()
            .where { IngredientAllergeenTable.ingredientId inList ids }
            .groupBy({ it[IngredientAllergeenTable.ingredientId] }) {
                IngredientAllergeen(
                    allergeen = it[IngredientAllergeenTable.allergeen],
                    aanwezigheid = it[IngredientAllergeenTable.aanwezigheid]
                )
            }
}

private fun UpdateBuilder<*>.vulIn(ingredient: Ingredient) {
    this[IngredietenTable.naam] = ingredient.naam
    this[IngredietenTable.eenheid] = ingredient.eenheid
    this[IngredietenTable.aankoopprijs] = ingredient.aankoopprijs
    this[IngredietenTable.energieKcal] = ingredient.voedingswaarden?.energie
    this[IngredietenTable.eiwitten] = ingredient.voedingswaarden?.eiwitten
    this[IngredietenTable.koolhydraten] = ingredient.voedingswaarden?.koolhydraten
    this[IngredietenTable.suikers] = ingredient.voedingswaarden?.suikers
    this[IngredietenTable.vetten] = ingredient.voedingswaarden?.vetten
    this[IngredietenTable.verzadigdVet] = ingredient.voedingswaarden?.verzadigdVet
    this[IngredietenTable.vezels] = ingredient.voedingswaarden?.vezels
    this[IngredietenTable.zout] = ingredient.voedingswaarden?.zout
}

private fun ResultRow.naarDomein(allergenen: List<IngredientAllergeen>): Ingredient {
    val heeftVoedingswaarden = this[IngredietenTable.energieKcal] != null
    return Ingredient(
        id = this[IngredietenTable.id],
        naam = this[IngredietenTable.naam],
        eenheid = this[IngredietenTable.eenheid],
        aankoopprijs = this[IngredietenTable.aankoopprijs],
        voedingswaarden = if (heeftVoedingswaarden) VoedingswaardePer100(
            energie = this[IngredietenTable.energieKcal]!!,
            eiwitten = this[IngredietenTable.eiwitten]!!,
            koolhydraten = this[IngredietenTable.koolhydraten]!!,
            suikers = this[IngredietenTable.suikers]!!,
            vetten = this[IngredietenTable.vetten]!!,
            verzadigdVet = this[IngredietenTable.verzadigdVet]!!,
            vezels = this[IngredietenTable.vezels]!!,
            zout = this[IngredietenTable.zout]!!
        ) else null,
        allergenen = allergenen
    )
}
