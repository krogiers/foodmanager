package be.foodmanager.label

import org.jetbrains.exposed.sql.Table
import java.util.UUID

object LabelsjablonenTable : Table("labelsjablonen") {
    val id           = uuid("id")
    val naam         = varchar("naam", 255).uniqueIndex()
    val breedteMm    = integer("breedte_mm")
    val hoogteMm     = integer("hoogte_mm")
    val htmlTemplate = text("html_template")
    override val primaryKey = PrimaryKey(id)
}

data class Labelsjabloon(
    val id: UUID = UUID.randomUUID(),
    val naam: String,
    val breedteMm: Int,
    val hoogteMm: Int,
    val htmlTemplate: String
)
