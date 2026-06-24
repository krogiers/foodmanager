package be.foodmanager.klant

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.klant.dto.*
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
@Transactional(readOnly = true)
class KlantService(
    private val repository: KlantRepository,
    private val events: ApplicationEventPublisher
) {
    fun zoekPaged(zoekterm: String? = null, herkomst: Herkomst? = null, pageRequest: PageRequest): PagedResponse<KlantResponse> {
        val p = repository.findPaged(zoekterm, herkomst, pageRequest)
        return PagedResponse(p.content.map { it.naarResponse() }, p.totalElements, p.totalPages, p.page, p.size)
    }

    fun haalOp(id: UUID): Either<KlantFout, KlantResponse> =
        repository.findById(id)
            ?.naarResponse()?.right()
            ?: KlantFout.NietGevonden(id).left()

    @Transactional
    fun maakAan(request: KlantAanmakenRequest): Either<KlantFout, KlantResponse> {
        val klant = Klant(
            voornaam = request.voornaam,
            familienaam = request.familienaam,
            email = request.email,
            telefoon = request.telefoon,
            adres = request.adres?.naarDomein(),
            herkomst = request.herkomst,
            herkomstToelichting = request.herkomstToelichting,
            voorkeurContactwijze = request.voorkeurContactwijze,
            allergenen = request.allergenen,
            specialeEisen = request.specialeEisen.map { SpecialeEis(omschrijving = it) }
        )
        return repository.save(klant)
            .also { events.publishEvent(KlantEvent.Aangemaakt(it)) }
            .naarResponse()
            .right()
    }

    @Transactional
    fun wijzig(id: UUID, request: KlantWijzigenRequest): Either<KlantFout, KlantResponse> {
        val bestaand = repository.findById(id) ?: return KlantFout.NietGevonden(id).left()
        if (bestaand.isGeanonimiseerd) return KlantFout.ReedsGeanonimiseerd(id).left()

        val bijgewerkt = bestaand.copy(
            voornaam = request.voornaam,
            familienaam = request.familienaam,
            email = request.email,
            telefoon = request.telefoon,
            adres = request.adres?.naarDomein(),
            herkomst = request.herkomst,
            herkomstToelichting = request.herkomstToelichting,
            voorkeurContactwijze = request.voorkeurContactwijze,
            allergenen = request.allergenen,
            specialeEisen = request.specialeEisen.map { SpecialeEis(omschrijving = it) }
        )
        return repository.save(bijgewerkt)
            .also { events.publishEvent(KlantEvent.Gewijzigd(it)) }
            .naarResponse()
            .right()
    }

    @Transactional
    fun anonimiseer(id: UUID): Either<KlantFout, Unit> {
        val klant = repository.findById(id) ?: return KlantFout.NietGevonden(id).left()
        if (klant.isGeanonimiseerd) return KlantFout.ReedsGeanonimiseerd(id).left()
        // TODO: controleer op actieve reservaties zodra ReservatieModule beschikbaar is
        repository.anonimiseer(id)
        events.publishEvent(KlantEvent.Geanonimiseerd(id))
        return Unit.right()
    }
}

private fun Klant.naarResponse() = KlantResponse(
    id = id,
    voornaam = voornaam,
    familienaam = familienaam,
    volledigNaam = volledigNaam,
    email = email,
    telefoon = telefoon,
    adres = adres?.let { AdresResponse(it.straat, it.huisnummer, it.gemeente, it.postcode, it.land) },
    herkomst = herkomst,
    herkomstToelichting = herkomstToelichting,
    voorkeurContactwijze = voorkeurContactwijze,
    allergenen = allergenen,
    specialeEisen = specialeEisen.map { SpecialeEisResponse(it.id, it.omschrijving) },
    isGeanonimiseerd = isGeanonimiseerd,
    aangemaaktOp = aangemaaktOp
)

private fun AdresRequest.naarDomein() = Adres(straat, huisnummer, gemeente, postcode, land)
