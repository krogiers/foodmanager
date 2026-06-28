package be.foodmanager.label

import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.SqlExpressionBuilder.neq
import org.jetbrains.exposed.sql.statements.UpdateBuilder
import org.springframework.stereotype.Repository
import java.util.UUID

@Repository
class LabelRepository {

    fun findAll(): List<Labelsjabloon> =
        LabelsjablonenTable.selectAll()
            .orderBy(LabelsjablonenTable.naam to SortOrder.ASC)
            .map { it.naarDomein() }

    fun findById(id: UUID): Labelsjabloon? =
        LabelsjablonenTable.selectAll()
            .where { LabelsjablonenTable.id eq id }
            .singleOrNull()?.naarDomein()

    fun existsByNaamIgnoreCase(naam: String): Boolean =
        LabelsjablonenTable.selectAll()
            .where { LabelsjablonenTable.naam.lowerCase() eq naam.lowercase() }
            .count() > 0

    fun existsByNaamIgnoreCaseAndIdNot(naam: String, id: UUID): Boolean =
        LabelsjablonenTable.selectAll()
            .where {
                (LabelsjablonenTable.naam.lowerCase() eq naam.lowercase()) and
                (LabelsjablonenTable.id neq id)
            }
            .count() > 0

    fun existsById(id: UUID): Boolean =
        LabelsjablonenTable.selectAll()
            .where { LabelsjablonenTable.id eq id }
            .count() > 0

    fun save(sjabloon: Labelsjabloon): Labelsjabloon {
        if (existsById(sjabloon.id)) {
            LabelsjablonenTable.update({ LabelsjablonenTable.id eq sjabloon.id }) { it.vulIn(sjabloon) }
        } else {
            LabelsjablonenTable.insert {
                it[id] = sjabloon.id
                it.vulIn(sjabloon)
            }
        }
        return sjabloon
    }

    fun deleteById(id: UUID) {
        LabelsjablonenTable.deleteWhere { LabelsjablonenTable.id eq id }
    }

    private fun UpdateBuilder<*>.vulIn(sjabloon: Labelsjabloon) {
        this[LabelsjablonenTable.naam]         = sjabloon.naam
        this[LabelsjablonenTable.breedteMm]    = sjabloon.breedteMm
        this[LabelsjablonenTable.hoogteMm]     = sjabloon.hoogteMm
        this[LabelsjablonenTable.htmlTemplate] = sjabloon.htmlTemplate
    }

    private fun ResultRow.naarDomein() = Labelsjabloon(
        id           = this[LabelsjablonenTable.id],
        naam         = this[LabelsjablonenTable.naam],
        breedteMm    = this[LabelsjablonenTable.breedteMm],
        hoogteMm     = this[LabelsjablonenTable.hoogteMm],
        htmlTemplate = this[LabelsjablonenTable.htmlTemplate]
    )
}
