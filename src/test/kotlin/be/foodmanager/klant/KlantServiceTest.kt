package be.foodmanager.klant

import arrow.core.Either
import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.Allergeen
import be.foodmanager.klant.dto.KlantAanmakenRequest
import be.foodmanager.klant.dto.KlantWijzigenRequest
import net.datafaker.Faker
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.context.ApplicationEventPublisher
import java.time.Instant
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class KlantServiceTest {

    @Mock lateinit var repository: KlantRepository
    @Mock lateinit var events: ApplicationEventPublisher
    @InjectMocks lateinit var service: KlantService

    private val faker = Faker()

    @Test
    fun `aanmaken van klant geeft Right met response terug`() {
        val request = maakAanmakenRequest()
        val opgeslagen = maakKlant(familienaam = request.familienaam, email = request.email ?: faker.internet().emailAddress())

        whenever(repository.save(any())).thenReturn(opgeslagen)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        assertThat((resultaat as Either.Right).value.familienaam).isEqualTo(opgeslagen.familienaam)
        verify(events).publishEvent(any<KlantEvent.Aangemaakt>())
    }

    @Test
    fun `ophalen van niet bestaande klant geeft Left NietGevonden terug`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(null)

        val resultaat = service.haalOp(id)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(KlantFout.NietGevonden::class.java)
    }

    @Test
    fun `wijzigen van geanonimiseerde klant geeft Left ReedsGeanonimiseerd terug`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(maakKlant(isGeanonimiseerd = true))

        val resultaat = service.wijzig(id, maakWijzigenRequest())

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(KlantFout.ReedsGeanonimiseerd::class.java)
        verify(repository, never()).save(any())
    }

    @Test
    fun `anonimiseren van bestaande klant slaagt en publiceert event`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(maakKlant())

        val resultaat = service.anonimiseer(id)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        verify(repository).anonimiseer(id)
        verify(events).publishEvent(any<KlantEvent.Geanonimiseerd>())
    }

    @Test
    fun `anonimiseren van al geanonimiseerde klant geeft Left ReedsGeanonimiseerd terug`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(maakKlant(isGeanonimiseerd = true))

        val resultaat = service.anonimiseer(id)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(KlantFout.ReedsGeanonimiseerd::class.java)
    }

    @Test
    fun `zoekPaged geeft gepagineerde lijst van klanten terug`() {
        val klanten = listOf(maakKlant(), maakKlant())
        val pageRequest = PageRequest(0, 20, "familienaam", "ASC")
        whenever(repository.findPaged(null, null, pageRequest))
            .thenReturn(PagedResponse(klanten, 2, 1, 0, 20))

        val resultaat = service.zoekPaged(null, null, pageRequest)

        assertThat(resultaat.content).hasSize(2)
    }

    private fun maakKlant(
        familienaam: String = faker.name().lastName(),
        email: String = faker.internet().emailAddress(),
        isGeanonimiseerd: Boolean = false
    ) = Klant(
        id = UUID.randomUUID(),
        familienaam = familienaam,
        email = email,
        herkomst = Herkomst.MOND_TOT_MOND,
        voorkeurContactwijze = VoorkeurContactwijze.EMAIL,
        isGeanonimiseerd = isGeanonimiseerd,
        aangemaaktOp = Instant.now()
    )

    private fun maakAanmakenRequest() = KlantAanmakenRequest(
        familienaam = faker.name().lastName(),
        email = faker.internet().emailAddress(),
        herkomst = Herkomst.SOCIALE_MEDIA,
        voorkeurContactwijze = VoorkeurContactwijze.WHATSAPP,
        allergenen = listOf(Allergeen.MELK, Allergeen.GLUTEN)
    )

    private fun maakWijzigenRequest() = KlantWijzigenRequest(
        familienaam = faker.name().lastName(),
        email = faker.internet().emailAddress(),
        herkomst = Herkomst.WEBSITE,
        voorkeurContactwijze = VoorkeurContactwijze.EMAIL
    )
}
