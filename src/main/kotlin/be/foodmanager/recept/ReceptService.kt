package be.foodmanager.recept

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.Eenheid
import be.foodmanager.ingredient.IngredientRepository
import be.foodmanager.ingredient.VoedingswaardePer100
import be.foodmanager.ingredient.dto.VoedingswaardenResponse
import be.foodmanager.recept.dto.*
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

@Service
@Transactional(readOnly = true)
class ReceptService(
    private val repository: ReceptRepository,
    private val ingredientRepository: IngredientRepository,
    private val events: ApplicationEventPublisher
) {

    fun zoekPaged(naam: String? = null, pageRequest: PageRequest): PagedResponse<ReceptSummaryResponse> {
        val p = repository.findPaged(naam, pageRequest)
        return PagedResponse(
            p.content.map { it.naarSummaryResponse() },
            p.totalElements, p.totalPages, p.page, p.size
        )
    }

    fun haalOp(id: UUID): Either<ReceptFout, ReceptResponse> =
        repository.findById(id)?.naarResponse()?.right() ?: ReceptFout.NietGevonden(id).left()

    @Transactional
    fun maakAan(request: ReceptAanmakenRequest): Either<ReceptFout, ReceptResponse> {
        if (repository.existsByNaamIgnoreCase(request.naam))
            return ReceptFout.NaamBestaatAl(request.naam).left()

        return resolveRegels(request.regels, receptId = null).map { regels ->
            val recept = Recept(naam = request.naam, houdbaarheid = request.naarHoudbaarheid(), bereidingswijze = request.bereidingswijze, opmerkingen = request.opmerkingen, regels = regels)
            repository.save(recept)
                .also { events.publishEvent(ReceptEvent.Aangemaakt(it)) }
                .naarResponse()
        }
    }

    @Transactional
    fun wijzig(id: UUID, request: ReceptWijzigenRequest): Either<ReceptFout, ReceptResponse> {
        val bestaand = repository.findById(id) ?: return ReceptFout.NietGevonden(id).left()
        if (repository.existsByNaamIgnoreCaseAndIdNot(request.naam, id))
            return ReceptFout.NaamBestaatAl(request.naam).left()

        return resolveRegels(request.regels, receptId = id).map { regels ->
            val bijgewerkt = bestaand.copy(naam = request.naam, houdbaarheid = request.naarHoudbaarheid(), bereidingswijze = request.bereidingswijze, opmerkingen = request.opmerkingen, regels = regels)
            repository.save(bijgewerkt)
                .also { events.publishEvent(ReceptEvent.Gewijzigd(it)) }
                .naarResponse()
        }
    }

    @Transactional
    fun verwijder(id: UUID): Either<ReceptFout, Unit> {
        val recept = repository.findById(id) ?: return ReceptFout.NietGevonden(id).left()
        if (repository.isInGebruik(id)) return ReceptFout.InGebruik(recept.naam).left()
        repository.deleteById(id)
        events.publishEvent(ReceptEvent.Verwijderd(id))
        return Unit.right()
    }

    private fun resolveRegels(
        requests: List<ReceptRegelRequest>,
        receptId: UUID?
    ): Either<ReceptFout, List<ReceptRegel>> {
        val regels = mutableListOf<ReceptRegel>()
        for ((index, req) in requests.withIndex()) {
            when (req.type) {
                RegelType.INGREDIENT -> {
                    val ingId = req.ingredientId
                        ?: return ReceptFout.IngredientNietGevonden(UUID.randomUUID()).left()
                    val ingredient = ingredientRepository.findById(ingId)
                        ?: return ReceptFout.IngredientNietGevonden(ingId).left()
                    regels.add(ReceptRegel(
                        hoeveelheid = req.hoeveelheid, eenheid = req.eenheid, volgorde = index,
                        component = ReceptComponent.IngredientComponent(ingredient)
                    ))
                }
                RegelType.RECEPT -> {
                    val srId = req.subReceptId
                        ?: return ReceptFout.SubReceptNietGevonden(UUID.randomUUID()).left()
                    val sub = repository.findById(srId)
                        ?: return ReceptFout.SubReceptNietGevonden(srId).left()
                    if (receptId != null && (sub.id == receptId || bevatRecept(sub, receptId)))
                        return ReceptFout.CirkelReferentie(sub.naam).left()
                    regels.add(ReceptRegel(
                        hoeveelheid = req.hoeveelheid, eenheid = req.eenheid, volgorde = index,
                        component = ReceptComponent.SubReceptComponent(sub)
                    ))
                }
            }
        }
        return regels.right()
    }

    private fun bevatRecept(recept: Recept, zoekId: UUID): Boolean =
        recept.regels.any { regel ->
            when (val c = regel.component) {
                is ReceptComponent.IngredientComponent -> false
                is ReceptComponent.SubReceptComponent ->
                    c.recept.id == zoekId || bevatRecept(c.recept, zoekId)
            }
        }

    // ─── Nutrition berekening ────────────────────────────────────────────────

    private fun berekenVoedingswaarden(regels: List<ReceptRegel>): VoedingswaardePer100? {
        var som: VoedingswaardePer100? = null
        for (regel in regels) {
            val bijdrage = when (val c = regel.component) {
                is ReceptComponent.IngredientComponent -> {
                    val vw = c.ingredient.voedingswaarden ?: continue
                    val factor = conversiefactor(regel.eenheid) * regel.hoeveelheid / BigDecimal("100")
                    vw * factor
                }
                is ReceptComponent.SubReceptComponent -> {
                    val subVw = berekenVoedingswaarden(c.recept.regels) ?: continue
                    subVw * regel.hoeveelheid
                }
            }
            som = som?.plus(bijdrage) ?: bijdrage
        }
        return som
    }

    private fun conversiefactor(eenheid: Eenheid): BigDecimal = when (eenheid) {
        Eenheid.KG, Eenheid.L -> BigDecimal("1000")
        else -> BigDecimal.ONE
    }

    // ─── Mapping naar responses ──────────────────────────────────────────────

    private fun Recept.naarResponse() = ReceptResponse(
        id = id, naam = naam,
        regels = regels.map { it.naarResponse() },
        houdbaarheid = houdbaarheid?.naarResponse(),
        voedingswaarden = berekenVoedingswaarden(regels)?.naarResponse(),
        bereidingswijze = bereidingswijze,
        opmerkingen = opmerkingen
    )

    private fun ReceptListItem.naarSummaryResponse() = ReceptSummaryResponse(
        id = id, naam = naam, houdbaarheid = houdbaarheid?.naarResponse(), aantalRegels = aantalRegels
    )

    private fun ReceptRegel.naarResponse() = ReceptRegelResponse(
        id = id,
        type = when (component) {
            is ReceptComponent.IngredientComponent -> RegelType.INGREDIENT
            is ReceptComponent.SubReceptComponent -> RegelType.RECEPT
        },
        hoeveelheid = hoeveelheid,
        eenheid = eenheid,
        ingredient = (component as? ReceptComponent.IngredientComponent)?.ingredient?.let {
            IngredientRefResponse(it.id, it.naam, it.eenheid)
        },
        subRecept = (component as? ReceptComponent.SubReceptComponent)?.recept?.let {
            ReceptRefResponse(it.id, it.naam)
        },
        volgorde = volgorde
    )

    private fun HoudbaarheidsDuur.naarResponse() = HoudbaarheidsDuurResponse(waarde, eenheid)

    private fun VoedingswaardePer100.naarResponse() = VoedingswaardenResponse(
        energie, eiwitten, koolhydraten, suikers, vetten, verzadigdVet, vezels, zout
    )

    private fun ReceptAanmakenRequest.naarHoudbaarheid() =
        if (houdbaarheidWaarde != null && houdbaarheidEenheid != null)
            HoudbaarheidsDuur(houdbaarheidWaarde, houdbaarheidEenheid)
        else null

    private fun ReceptWijzigenRequest.naarHoudbaarheid() =
        if (houdbaarheidWaarde != null && houdbaarheidEenheid != null)
            HoudbaarheidsDuur(houdbaarheidWaarde, houdbaarheidEenheid)
        else null
}

private operator fun VoedingswaardePer100.plus(other: VoedingswaardePer100) = VoedingswaardePer100(
    energie = energie + other.energie,
    eiwitten = eiwitten + other.eiwitten,
    koolhydraten = koolhydraten + other.koolhydraten,
    suikers = suikers + other.suikers,
    vetten = vetten + other.vetten,
    verzadigdVet = verzadigdVet + other.verzadigdVet,
    vezels = vezels + other.vezels,
    zout = zout + other.zout
)

private operator fun VoedingswaardePer100.times(factor: BigDecimal) = VoedingswaardePer100(
    energie = energie * factor,
    eiwitten = eiwitten * factor,
    koolhydraten = koolhydraten * factor,
    suikers = suikers * factor,
    vetten = vetten * factor,
    verzadigdVet = verzadigdVet * factor,
    vezels = vezels * factor,
    zout = zout * factor
)
