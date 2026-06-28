package be.foodmanager.ingredient.nutrition.nevo

import be.foodmanager.ingredient.VoedingswaardePer100
import be.foodmanager.ingredient.nutrition.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.like
import org.springframework.stereotype.Component
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode

@Component
@Transactional(readOnly = true)
class NevoProvider : NutritionProvider {

    override val providerNaam = "NEVO"

    override fun zoek(query: String, pagina: Int, paginaGrootte: Int, merk: String?): NutritionZoekPagina {
        val termen = query.trim().split(Regex("\\s+")).filter { it.isNotBlank() }

        fun baseQuery() = NevoProductenTable.selectAll().where {
            termen.fold(org.jetbrains.exposed.sql.Op.TRUE as org.jetbrains.exposed.sql.Op<Boolean>) { acc, term ->
                acc and (NevoProductenTable.naam.lowerCase() like "%${term.lowercase()}%")
            }
        }

        val eersteTermPrefix = "${termen.first().lowercase()}%"
        val total = baseQuery().count()
        val rows = baseQuery()
            .orderBy(
                // Namen die beginnen met de zoekterm komen eerst
                NevoProductenTable.naam.lowerCase().like(eersteTermPrefix) to SortOrder.DESC,
                NevoProductenTable.naam to SortOrder.ASC
            )
            .limit(paginaGrootte).offset((pagina * paginaGrootte).toLong())
            .toList()

        return NutritionZoekPagina(
            resultaten = rows.map { row ->
                NutritionZoekResultaat(
                    externeId        = "nevo:${row[NevoProductenTable.code]}",
                    naam             = row[NevoProductenTable.naam],
                    merk             = row[NevoProductenTable.groep],
                    heeftVoedingswaarden = row[NevoProductenTable.energieKcal] != null
                )
            },
            totaalAantal  = total.toInt(),
            pagina        = pagina,
            paginaGrootte = paginaGrootte
        )
    }

    override fun haalDetail(externeId: String): NutritionDetail {
        val code = externeId.removePrefix("nevo:")
        val row = NevoProductenTable.selectAll()
            .where { NevoProductenTable.code eq code }
            .single()

        val natriumMg = row[NevoProductenTable.natriumMg]
        val zoutG = natriumMg?.multiply(BigDecimal("2.5"))?.divide(BigDecimal("1000"), 4, RoundingMode.HALF_UP)

        val voedingswaarden = if (row[NevoProductenTable.energieKcal] != null) {
            VoedingswaardePer100(
                energie      = row[NevoProductenTable.energieKcal]!!,
                eiwitten     = row[NevoProductenTable.eiwittenG]     ?: BigDecimal.ZERO,
                koolhydraten = row[NevoProductenTable.koolhydratenG] ?: BigDecimal.ZERO,
                suikers      = row[NevoProductenTable.suikersG]      ?: BigDecimal.ZERO,
                vetten       = row[NevoProductenTable.vetG]          ?: BigDecimal.ZERO,
                verzadigdVet = row[NevoProductenTable.verzadigdVetG] ?: BigDecimal.ZERO,
                vezels       = row[NevoProductenTable.vezelsG]       ?: BigDecimal.ZERO,
                zout         = zoutG                                  ?: BigDecimal.ZERO
            )
        } else null

        return NutritionDetail(
            naam            = row[NevoProductenTable.naam],
            voedingswaarden = voedingswaarden,
            allergenen      = emptyList()
        )
    }

    fun aantalProducten(): Long = NevoProductenTable.selectAll().count()
}
