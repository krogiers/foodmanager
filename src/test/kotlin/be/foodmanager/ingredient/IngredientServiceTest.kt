package be.foodmanager.ingredient

import arrow.core.Either
import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.dto.IngredientAanmakenRequest
import be.foodmanager.ingredient.dto.IngredientWijzigenRequest
import be.foodmanager.ingredient.dto.VoedingswaardenRequest
import be.foodmanager.ingredient.nutrition.NutritionProviderService
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
import java.math.BigDecimal
import java.util.UUID

@ExtendWith(MockitoExtension::class)
class IngredientServiceTest {

    @Mock lateinit var repository: IngredientRepository
    @Mock lateinit var nutritionProviderService: NutritionProviderService
    @Mock lateinit var events: ApplicationEventPublisher
    @InjectMocks lateinit var service: IngredientService

    private val faker = Faker()

    @Test
    fun `aanmaken van ingredient geeft Right met response terug`() {
        val request = maakAanmakenRequest()
        val opgeslagen = maakIngredient(naam = request.naam, eenheid = request.eenheid)

        whenever(repository.existsByNaamIgnoreCase(request.naam)).thenReturn(false)
        whenever(repository.save(any())).thenReturn(opgeslagen)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        assertThat((resultaat as Either.Right).value.naam).isEqualTo(opgeslagen.naam)
        verify(events).publishEvent(any<IngredientEvent.Aangemaakt>())
    }

    @Test
    fun `aanmaken met bestaande naam geeft Left NaamBestaatAl terug`() {
        val request = maakAanmakenRequest()
        whenever(repository.existsByNaamIgnoreCase(request.naam)).thenReturn(true)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(IngredientFout.NaamBestaatAl::class.java)
        verify(repository, never()).save(any())
    }

    @Test
    fun `ophalen van niet bestaand ingredient geeft Left NietGevonden terug`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(null)

        val resultaat = service.haalOp(id)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(IngredientFout.NietGevonden::class.java)
    }

    @Test
    fun `zoekPaged geeft gepagineerde lijst van ingredienten terug`() {
        val ingredienten = listOf(maakIngredient(), maakIngredient())
        val pageRequest = PageRequest(0, 20, "naam", "ASC")
        whenever(repository.findPaged(null, pageRequest))
            .thenReturn(PagedResponse(ingredienten, 2, 1, 0, 20))

        val resultaat = service.zoekPaged(null, pageRequest)

        assertThat(resultaat.content).hasSize(2)
    }

    @Test
    fun `wijzigen past ingredient aan en publiceert event`() {
        val id = UUID.randomUUID()
        val bestaand = maakIngredient()
        val request = maakWijzigenRequest()

        whenever(repository.findById(id)).thenReturn(bestaand)
        whenever(repository.existsByNaamIgnoreCaseAndIdNot(request.naam, id)).thenReturn(false)
        whenever(repository.save(any())).thenReturn(bestaand)

        val resultaat = service.wijzig(id, request)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        verify(events).publishEvent(any<IngredientEvent.Gewijzigd>())
    }

    @Test
    fun `verwijderen van niet bestaand ingredient geeft Left NietGevonden terug`() {
        val id = UUID.randomUUID()
        whenever(repository.existsById(id)).thenReturn(false)

        val resultaat = service.verwijder(id)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(IngredientFout.NietGevonden::class.java)
    }

    @Test
    fun `verwijderen van bestaand ingredient geeft Right en publiceert event`() {
        val id = UUID.randomUUID()
        whenever(repository.existsById(id)).thenReturn(true)

        val resultaat = service.verwijder(id)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        verify(repository).deleteById(id)
        verify(events).publishEvent(any<IngredientEvent.Verwijderd>())
    }

    private fun maakIngredient(naam: String = faker.food().ingredient(), eenheid: Eenheid = Eenheid.G) =
        Ingredient(
            id = UUID.randomUUID(), naam = naam, eenheid = eenheid,
            aankoopprijs = BigDecimal(faker.number().randomDouble(2, 1, 20))
        )

    private fun maakAanmakenRequest() = IngredientAanmakenRequest(
        naam = faker.food().ingredient(), eenheid = Eenheid.G,
        aankoopprijs = BigDecimal(faker.number().randomDouble(2, 1, 20)),
        voedingswaarden = maakVoedingswaardenRequest()
    )

    private fun maakWijzigenRequest() = IngredientWijzigenRequest(
        naam = faker.food().ingredient(), eenheid = Eenheid.KG,
        aankoopprijs = BigDecimal(faker.number().randomDouble(2, 1, 50))
    )

    private fun maakVoedingswaardenRequest() = VoedingswaardenRequest(
        energie = BigDecimal(faker.number().randomDouble(1, 50, 500)),
        eiwitten = BigDecimal(faker.number().randomDouble(1, 0, 30)),
        koolhydraten = BigDecimal(faker.number().randomDouble(1, 0, 70)),
        suikers = BigDecimal(faker.number().randomDouble(1, 0, 40)),
        vetten = BigDecimal(faker.number().randomDouble(1, 0, 30)),
        verzadigdVet = BigDecimal(faker.number().randomDouble(1, 0, 15)),
        vezels = BigDecimal(faker.number().randomDouble(1, 0, 10)),
        zout = BigDecimal(faker.number().randomDouble(2, 0, 3))
    )
}
