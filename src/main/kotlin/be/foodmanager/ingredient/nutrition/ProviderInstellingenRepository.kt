package be.foodmanager.ingredient.nutrition

import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.upsert
import org.springframework.stereotype.Repository

@Repository
class ProviderInstellingenRepository {

    fun haalOp(): ProviderInstellingen =
        ProviderInstellingenTable.selectAll()
            .where { ProviderInstellingenTable.id eq 1L }
            .singleOrNull()
            ?.let { ProviderInstellingen(it[ProviderInstellingenTable.actieveProvider]) }
            ?: ProviderInstellingen()

    fun slaOp(instellingen: ProviderInstellingen) {
        ProviderInstellingenTable.upsert {
            it[id] = 1L
            it[actieveProvider] = instellingen.actieveProvider
        }
    }
}
