package be.foodmanager.recept

import arrow.core.Either
import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.Eenheid
import be.foodmanager.ingredient.Ingredient
import be.foodmanager.ingredient.IngredientRepository
import be.foodmanager.ingredient.VoedingswaardePer100
import be.foodmanager.recept.dto.ReceptAanmakenRequest
import be.foodmanager.recept.dto.ReceptRegelRequest
import be.foodmanager.recept.dto.RegelType
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
class ReceptServiceTest {

    @Mock lateinit var repository: ReceptRepository
    @Mock lateinit var ingredientRepository: IngredientRepository
    @Mock lateinit var events: ApplicationEventPublisher
    @InjectMocks lateinit var service: ReceptService

    private val faker = Faker()

    @Test
    fun `aanmaken van recept geeft Right met response terug`() {
        val request = maakAanmakenRequest()
        val recept = maakRecept(naam = request.naam)

        whenever(repository.existsByNaamIgnoreCase(request.naam)).thenReturn(false)
        whenever(repository.save(any())).thenReturn(recept)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        assertThat((resultaat as Either.Right).value.naam).isEqualTo(recept.naam)
        verify(events).publishEvent(any<ReceptEvent.Aangemaakt>())
    }

    @Test
    fun `aanmaken met bestaande naam geeft Left NaamBestaatAl terug`() {
        val request = maakAanmakenRequest()
        whenever(repository.existsByNaamIgnoreCase(request.naam)).thenReturn(true)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(ReceptFout.NaamBestaatAl::class.java)
        verify(repository, never()).save(any())
    }

    @Test
    fun `ophalen van niet bestaand recept geeft Left NietGevonden terug`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(null)

        val resultaat = service.haalOp(id)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(ReceptFout.NietGevonden::class.java)
    }

    @Test
    fun `verwijderen van recept in gebruik geeft Left InGebruik terug`() {
        val id = UUID.randomUUID()
        whenever(repository.findById(id)).thenReturn(maakRecept())
        whenever(repository.isInGebruik(id)).thenReturn(true)

        val resultaat = service.verwijder(id)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(ReceptFout.InGebruik::class.java)
        verify(repository, never()).deleteById(any())
    }

    @Test
    fun `aanmaken met ingredientregel laadt ingredient uit repository`() {
        val ingredient = maakIngredient()
        val regelReq = ReceptRegelRequest(
            type = RegelType.INGREDIENT,
            hoeveelheid = BigDecimal("200"),
            eenheid = Eenheid.G,
            ingredientId = ingredient.id
        )
        val request = maakAanmakenRequest(regels = listOf(regelReq))
        val recept = maakRecept(naam = request.naam, regels = listOf(
            ReceptRegel(
                hoeveelheid = BigDecimal("200"), eenheid = Eenheid.G,
                component = ReceptComponent.IngredientComponent(ingredient)
            )
        ))

        whenever(repository.existsByNaamIgnoreCase(request.naam)).thenReturn(false)
        whenever(ingredientRepository.findById(ingredient.id)).thenReturn(ingredient)
        whenever(repository.save(any())).thenReturn(recept)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Right::class.java)
        assertThat((resultaat as Either.Right).value.regels).hasSize(1)
    }

    @Test
    fun `aanmaken met onbekend ingredient geeft Left IngredientNietGevonden terug`() {
        val onbekendeId = UUID.randomUUID()
        val regelReq = ReceptRegelRequest(
            type = RegelType.INGREDIENT,
            hoeveelheid = BigDecimal("200"),
            eenheid = Eenheid.G,
            ingredientId = onbekendeId
        )
        val request = maakAanmakenRequest(regels = listOf(regelReq))

        whenever(repository.existsByNaamIgnoreCase(request.naam)).thenReturn(false)
        whenever(ingredientRepository.findById(onbekendeId)).thenReturn(null)

        val resultaat = service.maakAan(request)

        assertThat(resultaat).isInstanceOf(Either.Left::class.java)
        assertThat((resultaat as Either.Left).value).isInstanceOf(ReceptFout.IngredientNietGevonden::class.java)
    }

    @Test
    fun `zoekPaged geeft gepagineerde lijst terug`() {
        val items = listOf(
            ReceptListItem(UUID.randomUUID(), faker.food().dish(), null, 3),
            ReceptListItem(UUID.randomUUID(), faker.food().dish(), null, 1)
        )
        val pageRequest = PageRequest(0, 20, "naam", "ASC")
        whenever(repository.findPaged(null, pageRequest))
            .thenReturn(PagedResponse(items, 2, 1, 0, 20))

        val resultaat = service.zoekPaged(null, pageRequest)

        assertThat(resultaat.content).hasSize(2)
    }

    private fun maakRecept(
        naam: String = faker.food().dish(),
        regels: List<ReceptRegel> = emptyList()
    ) = Recept(naam = naam, regels = regels)

    private fun maakIngredient() = Ingredient(
        naam = faker.food().ingredient(),
        eenheid = Eenheid.G,
        voedingswaarden = VoedingswaardePer100(
            energie = BigDecimal("350"), eiwitten = BigDecimal("10"),
            koolhydraten = BigDecimal("70"), suikers = BigDecimal("1"),
            vetten = BigDecimal("2"), verzadigdVet = BigDecimal("0.5"),
            vezels = BigDecimal("3"), zout = BigDecimal("0.01")
        )
    )

    private fun maakAanmakenRequest(
        naam: String = faker.food().dish(),
        regels: List<ReceptRegelRequest> = emptyList()
    ) = ReceptAanmakenRequest(naam = naam, regels = regels)
}
