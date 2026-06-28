package be.foodmanager.ingredient.nutrition.nevo

import org.jetbrains.exposed.sql.batchUpsert
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.InputStream
import java.math.BigDecimal

data class NevoImportResultaat(val geimporteerd: Int, val fouten: List<String>)

private data class NevoRij(
    val code: String,
    val naam: String,
    val groep: String?,
    val energieKcal: java.math.BigDecimal?,
    val eiwittenG: java.math.BigDecimal?,
    val koolhydratenG: java.math.BigDecimal?,
    val suikersG: java.math.BigDecimal?,
    val vetG: java.math.BigDecimal?,
    val verzadigdVetG: java.math.BigDecimal?,
    val vezelsG: java.math.BigDecimal?,
    val natriumMg: java.math.BigDecimal?
)

@Service
class NevoImportService {

    // Flexibele kolomnaam-mapping: genormaliseerde sleutels → herkende kolomnamen (lowercase)
    private val KOLOM_MAP = mapOf(
        "code"            to setOf("code", "productcode", "nevo-code"),
        "naam"            to setOf("naam", "productomschrijving", "omschrijving", "product",
                                   "voedingsmiddelnaam/dutch food name", "voedingsmiddelnaam"),
        "groep"           to setOf("groep", "productgroep", "groepsnaam", "levensmiddelengroep",
                                   "voedingsmiddelgroep"),
        "energie_kcal"    to setOf("energie_kcal", "energie (kcal)", "energiewaarde (kcal)", "kcal",
                                   "energie kcal", "enercc (kcal)"),
        "eiwitten_g"      to setOf("eiwitten_g", "eiwit (g)", "eiwitten (g)", "eiwit", "eiwitten",
                                   "prot (g)"),
        "koolhydraten_g"  to setOf("koolhydraten_g", "koolhydraten (g)", "koolhydraten", "cho (g)"),
        "suikers_g"       to setOf("suikers_g", "suikers (g)", "suikers", "sugar (g)"),
        "vet_g"           to setOf("vet_g", "vet (g)", "vetten (g)", "vet", "vetten", "fat (g)"),
        "verzadigd_vet_g" to setOf("verzadigd_vet_g", "verzadigd vet (g)", "verzadigd vet",
                                   "verzadigde vetten (g)", "fasat (g)"),
        "vezels_g"        to setOf("vezels_g", "voedingsvezel (g)", "vezels (g)", "voedingsvezels (g)",
                                   "voedingsvezel", "vezels", "fibt (g)"),
        "natrium_mg"      to setOf("natrium_mg", "natrium (mg)", "natrium", "na (mg)"),
    )

    @Transactional
    fun importeer(input: InputStream, bestandsnaam: String): NevoImportResultaat {
        val regels = input.bufferedReader(Charsets.UTF_8).readLines().filter { it.isNotBlank() }
        if (regels.isEmpty()) return NevoImportResultaat(0, listOf("Bestand is leeg."))

        val scheidingsteken = bepaalScheidingsteken(regels.first())
        val headers = regels.first().split(scheidingsteken).map { it.trim().trim('"').lowercase() }

        val kolomIndex = KOLOM_MAP.mapValues { (_, synoniemen) ->
            headers.indexOfFirst { h -> synoniemen.any { s -> h == s } }.takeIf { it >= 0 }
        }

        val codeIdx = kolomIndex["code"]
            ?: return NevoImportResultaat(0, listOf("Kolom 'code' of 'Productcode' niet gevonden. Headers: ${headers.joinToString(", ")}"))
        val naamIdx = kolomIndex["naam"]
            ?: return NevoImportResultaat(0, listOf("Kolom 'naam' of 'Productomschrijving' niet gevonden."))

        val rijen = regels.drop(1)
        val fouten = mutableListOf<String>()

        val geldigeRijen = rijen.mapIndexedNotNull { i, lijn ->
            val kolommen = lijn.split(scheidingsteken).map { it.trim().trim('"') }
            val code = kolommen.getOrNull(codeIdx)?.ifBlank { null }
            val naam = kolommen.getOrNull(naamIdx)?.ifBlank { null }
            if (code == null || naam == null) {
                if (lijn.isNotBlank()) fouten.add("Rij ${i + 2}: code of naam ontbreekt — overgeslagen.")
                null
            } else {
                NevoRij(
                    code          = code,
                    naam          = naam,
                    groep         = kolomIndex["groep"]?.let { kolommen.getOrNull(it)?.ifBlank { null } },
                    energieKcal   = kolomIndex["energie_kcal"]?.let { kolommen.getOrNull(it).parseer() },
                    eiwittenG     = kolomIndex["eiwitten_g"]?.let { kolommen.getOrNull(it).parseer() },
                    koolhydratenG = kolomIndex["koolhydraten_g"]?.let { kolommen.getOrNull(it).parseer() },
                    suikersG      = kolomIndex["suikers_g"]?.let { kolommen.getOrNull(it).parseer() },
                    vetG          = kolomIndex["vet_g"]?.let { kolommen.getOrNull(it).parseer() },
                    verzadigdVetG = kolomIndex["verzadigd_vet_g"]?.let { kolommen.getOrNull(it).parseer() },
                    vezelsG       = kolomIndex["vezels_g"]?.let { kolommen.getOrNull(it).parseer() },
                    natriumMg     = kolomIndex["natrium_mg"]?.let { kolommen.getOrNull(it).parseer() }
                )
            }
        }

        NevoProductenTable.batchUpsert(geldigeRijen, keys = arrayOf(NevoProductenTable.code)) { rij ->
            this[NevoProductenTable.code]          = rij.code
            this[NevoProductenTable.naam]          = rij.naam.take(500)
            this[NevoProductenTable.groep]         = rij.groep?.take(200)
            this[NevoProductenTable.energieKcal]   = rij.energieKcal
            this[NevoProductenTable.eiwittenG]     = rij.eiwittenG
            this[NevoProductenTable.koolhydratenG] = rij.koolhydratenG
            this[NevoProductenTable.suikersG]      = rij.suikersG
            this[NevoProductenTable.vetG]          = rij.vetG
            this[NevoProductenTable.verzadigdVetG] = rij.verzadigdVetG
            this[NevoProductenTable.vezelsG]       = rij.vezelsG
            this[NevoProductenTable.natriumMg]     = rij.natriumMg
        }

        return NevoImportResultaat(geldigeRijen.size, fouten)
    }

    private fun bepaalScheidingsteken(header: String): String = when {
        header.contains('|') -> "|"
        header.contains(';') -> ";"
        else -> ","
    }

    private fun String?.parseer(): BigDecimal? {
        if (this == null) return null
        val schoon = this.replace(',', '.').trim()
        return schoon.toBigDecimalOrNull()
    }
}
