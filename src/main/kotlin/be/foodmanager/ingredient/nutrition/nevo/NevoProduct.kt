package be.foodmanager.ingredient.nutrition.nevo

import org.jetbrains.exposed.sql.Table

object NevoProductenTable : Table("nevo_producten") {
    val id              = long("id").autoIncrement()
    val code            = varchar("code", 30).uniqueIndex()
    val naam            = varchar("naam", 500)
    val groep           = varchar("groep", 200).nullable()
    val energieKcal     = decimal("energie_kcal", 10, 2).nullable()
    val eiwittenG       = decimal("eiwitten_g", 10, 2).nullable()
    val koolhydratenG   = decimal("koolhydraten_g", 10, 2).nullable()
    val suikersG        = decimal("suikers_g", 10, 2).nullable()
    val vetG            = decimal("vet_g", 10, 2).nullable()
    val verzadigdVetG   = decimal("verzadigd_vet_g", 10, 2).nullable()
    val vezelsG         = decimal("vezels_g", 10, 2).nullable()
    val natriumMg       = decimal("natrium_mg", 10, 2).nullable()
    override val primaryKey = PrimaryKey(id)
}
