package be.foodmanager.klant

import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.Allergeen
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.statements.UpdateBuilder
import org.springframework.stereotype.Repository
import java.time.ZoneId
import java.util.UUID

@Repository
class KlantRepository {

    fun findPaged(zoekterm: String? = null, pageRequest: PageRequest): PagedResponse<Klant> {
        val sortColumn = when (pageRequest.sortBy) {
            "voornaam" -> KlantenTable.voornaam
            "email" -> KlantenTable.email
            "aangemaaktOp" -> KlantenTable.aangemaaktOp
            else -> KlantenTable.familienaam
        }
        val sortOrder = if (pageRequest.sortDir == "DESC") SortOrder.DESC else SortOrder.ASC

        fun baseQuery() = if (zoekterm != null) {
            val term = "%${zoekterm.lowercase()}%"
            KlantenTable.selectAll().where {
                (KlantenTable.familienaam.lowerCase() like term) or
                (KlantenTable.voornaam.lowerCase() like term)
            }
        } else {
            KlantenTable.selectAll()
        }

        val total = baseQuery().count()
        val rows = baseQuery()
            .orderBy(sortColumn to sortOrder)
            .limit(pageRequest.size).offset(pageRequest.offset)
            .toList()
        val ids = rows.map { it[KlantenTable.id] }
        val allergeenMap = allergeenVoorIds(ids)
        val eisenMap = eisenVoorIds(ids)
        val content = rows.map {
            it.naarDomein(
                allergeenMap[it[KlantenTable.id]] ?: emptyList(),
                eisenMap[it[KlantenTable.id]] ?: emptyList()
            )
        }
        return PagedResponse(content, total, pageRequest.totalPages(total), pageRequest.page, pageRequest.size)
    }

    fun findById(id: UUID): Klant? =
        KlantenTable.selectAll()
            .where { KlantenTable.id eq id }
            .singleOrNull()
            ?.naarDomein(allergeenVoor(id), eisenVoor(id))

    fun existsById(id: UUID): Boolean =
        KlantenTable.selectAll().where { KlantenTable.id eq id }.count() > 0

    fun save(klant: Klant): Klant {
        if (existsById(klant.id)) {
            KlantenTable.update({ KlantenTable.id eq klant.id }) { row -> row.vulIn(klant) }
        } else {
            KlantenTable.insert { row ->
                row[id] = klant.id
                row[aangemaaktOp] = klant.aangemaaktOp
                row.vulIn(klant)
            }
        }
        KlantAllergeenTable.deleteWhere { klantId eq klant.id }
        klant.allergenen.forEach { a ->
            KlantAllergeenTable.insert {
                it[klantId] = klant.id
                it[allergeen] = a
            }
        }
        KlantSpecialeEisTable.deleteWhere { klantId eq klant.id }
        klant.specialeEisen.forEach { eis ->
            KlantSpecialeEisTable.insert {
                it[id] = eis.id
                it[klantId] = klant.id
                it[omschrijving] = eis.omschrijving
            }
        }
        return klant
    }

    fun anonimiseer(id: UUID) {
        KlantenTable.update({ KlantenTable.id eq id }) {
            it[voornaam] = null
            it[familienaam] = "[Geanonimiseerde klant]"
            it[email] = null
            it[telefoon] = null
            it[straat] = null
            it[huisnummer] = null
            it[gemeente] = null
            it[postcode] = null
            it[land] = null
            it[herkomstToelichting] = null
            it[isGeanonimiseerd] = true
        }
        KlantAllergeenTable.deleteWhere { klantId eq id }
        KlantSpecialeEisTable.deleteWhere { klantId eq id }
    }

    private fun allergeenVoor(id: UUID): List<Allergeen> =
        KlantAllergeenTable.selectAll()
            .where { KlantAllergeenTable.klantId eq id }
            .map { it[KlantAllergeenTable.allergeen] }

    private fun allergeenVoorIds(ids: List<UUID>): Map<UUID, List<Allergeen>> =
        if (ids.isEmpty()) emptyMap()
        else KlantAllergeenTable.selectAll()
            .where { KlantAllergeenTable.klantId inList ids }
            .groupBy({ it[KlantAllergeenTable.klantId] }) { it[KlantAllergeenTable.allergeen] }

    private fun eisenVoor(id: UUID): List<SpecialeEis> =
        KlantSpecialeEisTable.selectAll()
            .where { KlantSpecialeEisTable.klantId eq id }
            .map { SpecialeEis(it[KlantSpecialeEisTable.id], it[KlantSpecialeEisTable.omschrijving]) }

    private fun eisenVoorIds(ids: List<UUID>): Map<UUID, List<SpecialeEis>> =
        if (ids.isEmpty()) emptyMap()
        else KlantSpecialeEisTable.selectAll()
            .where { KlantSpecialeEisTable.klantId inList ids }
            .groupBy({ it[KlantSpecialeEisTable.klantId] }) {
                SpecialeEis(it[KlantSpecialeEisTable.id], it[KlantSpecialeEisTable.omschrijving])
            }
}

private fun UpdateBuilder<*>.vulIn(klant: Klant) {
    this[KlantenTable.voornaam] = klant.voornaam
    this[KlantenTable.familienaam] = klant.familienaam
    this[KlantenTable.email] = klant.email
    this[KlantenTable.telefoon] = klant.telefoon
    this[KlantenTable.straat] = klant.adres?.straat
    this[KlantenTable.huisnummer] = klant.adres?.huisnummer
    this[KlantenTable.gemeente] = klant.adres?.gemeente
    this[KlantenTable.postcode] = klant.adres?.postcode
    this[KlantenTable.land] = klant.adres?.land
    this[KlantenTable.herkomst] = klant.herkomst
    this[KlantenTable.herkomstToelichting] = klant.herkomstToelichting
    this[KlantenTable.voorkeurContactwijze] = klant.voorkeurContactwijze
    this[KlantenTable.isGeanonimiseerd] = klant.isGeanonimiseerd
}

private fun ResultRow.naarDomein(allergenen: List<Allergeen>, eisen: List<SpecialeEis>): Klant {
    val heeftAdres = this[KlantenTable.straat] != null
    return Klant(
        id = this[KlantenTable.id],
        voornaam = this[KlantenTable.voornaam],
        familienaam = this[KlantenTable.familienaam],
        email = this[KlantenTable.email],
        telefoon = this[KlantenTable.telefoon],
        adres = if (heeftAdres) Adres(
            straat = this[KlantenTable.straat]!!,
            huisnummer = this[KlantenTable.huisnummer]!!,
            gemeente = this[KlantenTable.gemeente]!!,
            postcode = this[KlantenTable.postcode]!!,
            land = this[KlantenTable.land] ?: "België"
        ) else null,
        herkomst = this[KlantenTable.herkomst],
        herkomstToelichting = this[KlantenTable.herkomstToelichting],
        voorkeurContactwijze = this[KlantenTable.voorkeurContactwijze],
        allergenen = allergenen,
        specialeEisen = eisen,
        isGeanonimiseerd = this[KlantenTable.isGeanonimiseerd],
        aangemaaktOp = this[KlantenTable.aangemaaktOp].atZone(ZoneId.systemDefault()).toInstant()
    )
}
