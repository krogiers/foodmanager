package be.foodmanager.ingredient.nutrition

import org.jetbrains.exposed.sql.Table

object ProviderInstellingenTable : Table("provider_instellingen") {
    val id = long("id")
    val actieveProvider = varchar("actieve_provider", 100)
    override val primaryKey = PrimaryKey(id)
}

data class ProviderInstellingen(val actieveProvider: String = "OPEN_FOOD_FACTS")
