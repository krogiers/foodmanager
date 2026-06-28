package be.foodmanager.label

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import be.foodmanager.ingredient.Allergeen
import be.foodmanager.ingredient.AllergeenAanwezigheid
import be.foodmanager.ingredient.Eenheid
import be.foodmanager.ingredient.Ingredient
import be.foodmanager.ingredient.IngredientRepository
import be.foodmanager.ingredient.VoedingswaardePer100
import be.foodmanager.label.dto.*
import be.foodmanager.recept.Recept
import be.foodmanager.recept.ReceptComponent
import be.foodmanager.recept.ReceptRegel
import be.foodmanager.recept.ReceptRepository
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.ByteArrayOutputStream
import java.math.BigDecimal
import java.util.UUID

@Service
@Transactional(readOnly = true)
class LabelService(
    private val repository: LabelRepository,
    private val receptRepository: ReceptRepository,
    private val ingredientRepository: IngredientRepository,
    private val events: ApplicationEventPublisher
) {

    fun haalAlleOp(): List<LabelsjabloonSummaryResponse> =
        repository.findAll().map { it.naarSummaryResponse() }

    fun haalOp(id: UUID): Either<LabelFout, LabelsjabloonResponse> =
        repository.findById(id)?.naarResponse()?.right() ?: LabelFout.NietGevonden(id).left()

    @Transactional
    fun maakAan(request: LabelsjabloonAanmakenRequest): Either<LabelFout, LabelsjabloonResponse> {
        if (repository.existsByNaamIgnoreCase(request.naam))
            return LabelFout.NaamBestaatAl(request.naam).left()
        val sjabloon = Labelsjabloon(
            naam         = request.naam,
            breedteMm    = request.breedteMm,
            hoogteMm     = request.hoogteMm,
            htmlTemplate = request.htmlTemplate
        )
        return repository.save(sjabloon)
            .also { events.publishEvent(LabelEvent.Aangemaakt(it)) }
            .naarResponse().right()
    }

    @Transactional
    fun wijzig(id: UUID, request: LabelsjabloonWijzigenRequest): Either<LabelFout, LabelsjabloonResponse> {
        val bestaand = repository.findById(id) ?: return LabelFout.NietGevonden(id).left()
        if (repository.existsByNaamIgnoreCaseAndIdNot(request.naam, id))
            return LabelFout.NaamBestaatAl(request.naam).left()
        val bijgewerkt = bestaand.copy(
            naam         = request.naam,
            breedteMm    = request.breedteMm,
            hoogteMm     = request.hoogteMm,
            htmlTemplate = request.htmlTemplate
        )
        return repository.save(bijgewerkt)
            .also { events.publishEvent(LabelEvent.Gewijzigd(it)) }
            .naarResponse().right()
    }

    @Transactional
    fun verwijder(id: UUID): Either<LabelFout, Unit> {
        repository.findById(id) ?: return LabelFout.NietGevonden(id).left()
        repository.deleteById(id)
        events.publishEvent(LabelEvent.Verwijderd(id))
        return Unit.right()
    }

    // ─── Voorbeeld & PDF ────────────────────────────────────────────────────────

    fun genereerVoorbeeldHtml(
        sjabloonId: UUID,
        receptId: UUID,
        houdbaarheid: String
    ): Either<LabelFout, String> {
        val sjabloon = repository.findById(sjabloonId) ?: return LabelFout.NietGevonden(sjabloonId).left()
        val recept   = receptRepository.findById(receptId) ?: return LabelFout.ReceptNietGevonden(receptId).left()
        val gevuld   = vulTokensIn(sjabloon.htmlTemplate, recept, houdbaarheid)
        return bouwVolledigeHtml(sjabloon, gevuld, aantalExemplaren = 1).right()
    }

    fun genereerPdf(
        sjabloonId: UUID,
        receptId: UUID,
        houdbaarheid: String,
        aantalExemplaren: Int
    ): Either<LabelFout, ByteArray> {
        val sjabloon = repository.findById(sjabloonId) ?: return LabelFout.NietGevonden(sjabloonId).left()
        val recept   = receptRepository.findById(receptId) ?: return LabelFout.ReceptNietGevonden(receptId).left()
        val gevuld   = vulTokensIn(sjabloon.htmlTemplate, recept, houdbaarheid)
        val html     = bouwVolledigeHtml(sjabloon, gevuld, aantalExemplaren)
        val baos = ByteArrayOutputStream()
        PdfRendererBuilder()
            .withHtmlContent(html, null)
            .toStream(baos)
            .run()
        return baos.toByteArray().right()
    }

    // ─── Token-vervanging ────────────────────────────────────────────────────────

    private fun vulTokensIn(template: String, recept: Recept, houdbaarheid: String): String {
        val bijdragen = collectIngredientenEU(recept.regels)
        val ingIds    = bijdragen.map { it.ingredient.id }.distinct()
        val allergenenMap = ingredientRepository.findAllergenenVoorIds(ingIds)

        val ingredientenLijst = bijdragen
            .groupBy { it.ingredient.id }
            .map { (_, groep) -> groep.first().ingredient.naam to groep.sumOf { it.hoeveelheid } }
            .sortedByDescending { (_, gewicht) -> gewicht }
            .joinToString(", ") { (naam, _) -> naam }

        val alleAllergenen = bijdragen
            .flatMap { b -> allergenenMap[b.ingredient.id] ?: emptyList() }
            .distinctBy { it.allergeen.name + it.aanwezigheid.name }

        val allergenenBevat = alleAllergenen
            .filter { it.aanwezigheid == AllergeenAanwezigheid.BEVAT }
            .joinToString(", ") { allergeenNaam(it.allergeen) }
            .ifEmpty { "—" }

        val allergenenKanBevatten = alleAllergenen
            .filter { it.aanwezigheid == AllergeenAanwezigheid.KAN_BEVATTEN }
            .joinToString(", ") { allergeenNaam(it.allergeen) }
            .ifEmpty { "—" }

        val voedingswaarden = berekenVoedingswaarden(recept.regels)
        val voedingswaardenHtml = voedingswaarden?.naarHtmlTabel() ?: ""

        return template
            .replace("{{productnaam}}", escapeHtml(recept.naam))
            .replace("{{ingredienten}}", escapeHtml(ingredientenLijst))
            .replace("{{allergenen_bevat}}", escapeHtml(allergenenBevat))
            .replace("{{allergenen_kan_bevatten}}", escapeHtml(allergenenKanBevatten))
            .replace("{{voedingswaarden}}", voedingswaardenHtml)
            .replace("{{houdbaarheid}}", escapeHtml(houdbaarheid))
            .replace("{{producent}}", "Bakkerij")
    }

    private fun bouwVolledigeHtml(sjabloon: Labelsjabloon, gevuldTemplate: String, aantalExemplaren: Int): String {
        val labels = (1..aantalExemplaren).joinToString("\n") {
            "<div class=\"__label__\">$gevuldTemplate</div>"
        }
        return """<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    @page { size: ${sjabloon.breedteMm}mm ${sjabloon.hoogteMm}mm; margin: 0; }
    body  { margin: 0; padding: 0; }
    .__label__ { width: ${sjabloon.breedteMm}mm; height: ${sjabloon.hoogteMm}mm; overflow: hidden; page-break-after: always; }
  </style>
</head>
<body>
$labels
</body>
</html>"""
    }

    // ─── EU-conforme ingrediëntenlijst ───────────────────────────────────────────

    private data class IngredientBijdrage(val ingredient: Ingredient, val hoeveelheid: BigDecimal)

    private fun collectIngredientenEU(
        regels: List<ReceptRegel>,
        multiplier: BigDecimal = BigDecimal.ONE
    ): List<IngredientBijdrage> = regels.flatMap { regel ->
        when (val c = regel.component) {
            is ReceptComponent.IngredientComponent -> listOf(
                IngredientBijdrage(c.ingredient, regel.hoeveelheid * conversiefactor(regel.eenheid) * multiplier)
            )
            is ReceptComponent.SubReceptComponent  -> collectIngredientenEU(
                c.recept.regels,
                regel.hoeveelheid * multiplier
            )
        }
    }

    // ─── Voedingswaarden berekening ──────────────────────────────────────────────

    private fun berekenVoedingswaarden(regels: List<ReceptRegel>): VoedingswaardePer100? {
        var som: VoedingswaardePer100? = null
        for (regel in regels) {
            val bijdrage = when (val c = regel.component) {
                is ReceptComponent.IngredientComponent -> {
                    val vw = c.ingredient.voedingswaarden ?: continue
                    vw * (conversiefactor(regel.eenheid) * regel.hoeveelheid / BigDecimal("100"))
                }
                is ReceptComponent.SubReceptComponent  -> {
                    val subVw = berekenVoedingswaarden(c.recept.regels) ?: continue
                    subVw * regel.hoeveelheid
                }
            }
            som = som?.plus(bijdrage) ?: bijdrage
        }
        return som
    }

    private fun VoedingswaardePer100.naarHtmlTabel(): String {
        fun r(naam: String, waarde: BigDecimal, eenheid: String) =
            "<tr><td>$naam</td><td>${waarde.setScale(1, java.math.RoundingMode.HALF_UP)} $eenheid</td></tr>"
        return """<table class="voedingswaarden">
<thead><tr><th colspan="2">Voedingswaarden (per batch)</th></tr></thead>
<tbody>
${r("Energie", energie, "kcal")}
${r("Eiwitten", eiwitten, "g")}
${r("Koolhydraten", koolhydraten, "g")}
${r("waarvan suikers", suikers, "g")}
${r("Vetten", vetten, "g")}
${r("waarvan verzadigd", verzadigdVet, "g")}
${r("Vezels", vezels, "g")}
${r("Zout", zout, "g")}
</tbody>
</table>"""
    }

    // ─── Hulpfuncties ────────────────────────────────────────────────────────────

    private fun conversiefactor(eenheid: Eenheid): BigDecimal = when (eenheid) {
        Eenheid.KG, Eenheid.L -> BigDecimal("1000")
        else -> BigDecimal.ONE
    }

    private fun allergeenNaam(a: Allergeen) = when (a) {
        Allergeen.GLUTEN      -> "Gluten"
        Allergeen.SCHAALDIEREN -> "Schaaldieren"
        Allergeen.EIEREN      -> "Eieren"
        Allergeen.VIS         -> "Vis"
        Allergeen.PINDA       -> "Pinda's"
        Allergeen.SOJA        -> "Soja"
        Allergeen.MELK        -> "Melk"
        Allergeen.NOTEN       -> "Noten"
        Allergeen.SELDERIJ    -> "Selderij"
        Allergeen.MOSTERD     -> "Mosterd"
        Allergeen.SESAM       -> "Sesam"
        Allergeen.SULFIET     -> "Sulfieten"
        Allergeen.LUPINE      -> "Lupine"
        Allergeen.WEEKDIEREN  -> "Weekdieren"
    }

    private fun escapeHtml(s: String) = s
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")

    // ─── Mapping ─────────────────────────────────────────────────────────────────

    private fun Labelsjabloon.naarResponse() = LabelsjabloonResponse(id, naam, breedteMm, hoogteMm, htmlTemplate)
    private fun Labelsjabloon.naarSummaryResponse() = LabelsjabloonSummaryResponse(id, naam, breedteMm, hoogteMm)
}

private operator fun VoedingswaardePer100.plus(other: VoedingswaardePer100) = VoedingswaardePer100(
    energie = energie + other.energie, eiwitten = eiwitten + other.eiwitten,
    koolhydraten = koolhydraten + other.koolhydraten, suikers = suikers + other.suikers,
    vetten = vetten + other.vetten, verzadigdVet = verzadigdVet + other.verzadigdVet,
    vezels = vezels + other.vezels, zout = zout + other.zout
)

private operator fun VoedingswaardePer100.times(factor: BigDecimal) = VoedingswaardePer100(
    energie = energie * factor, eiwitten = eiwitten * factor,
    koolhydraten = koolhydraten * factor, suikers = suikers * factor,
    vetten = vetten * factor, verzadigdVet = verzadigdVet * factor,
    vezels = vezels * factor, zout = zout * factor
)
