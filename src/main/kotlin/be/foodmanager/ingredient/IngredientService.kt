package be.foodmanager.ingredient

import arrow.core.Either
import arrow.core.left
import arrow.core.right
import be.foodmanager.common.PageRequest
import be.foodmanager.common.PagedResponse
import be.foodmanager.ingredient.dto.*
import be.foodmanager.ingredient.nutrition.NutritionProviderService
import be.foodmanager.ingredient.nutrition.NutritionZoekPagina
import org.springframework.context.ApplicationEventPublisher
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.util.UUID

@Service
@Transactional(readOnly = true)
class IngredientService(
    private val repository: IngredientRepository,
    private val nutritionProviderService: NutritionProviderService,
    private val events: ApplicationEventPublisher
) {
    fun zoekPaged(naam: String? = null, pageRequest: PageRequest): PagedResponse<IngredientResponse> {
        val p = repository.findPaged(naam, pageRequest)
        return PagedResponse(p.content.map { it.naarResponse() }, p.totalElements, p.totalPages, p.page, p.size)
    }

    fun haalOp(id: UUID): Either<IngredientFout, IngredientResponse> =
        repository.findById(id)
            ?.naarResponse()?.right()
            ?: IngredientFout.NietGevonden(id).left()

    @Transactional
    fun maakAan(request: IngredientAanmakenRequest): Either<IngredientFout, IngredientResponse> {
        if (repository.existsByNaamIgnoreCase(request.naam)) {
            return IngredientFout.NaamBestaatAl(request.naam).left()
        }
        val ingredient = Ingredient(
            naam = request.naam,
            eenheid = request.eenheid,
            aankoopprijs = request.aankoopprijs,
            categorie = request.categorie,
            voedingswaarden = request.voedingswaarden?.naarDomein(),
            allergenen = request.allergenen.map { it.naarDomein() }
        )
        return repository.save(ingredient)
            .also { events.publishEvent(IngredientEvent.Aangemaakt(it)) }
            .naarResponse()
            .right()
    }

    @Transactional
    fun wijzig(id: UUID, request: IngredientWijzigenRequest): Either<IngredientFout, IngredientResponse> {
        val bestaand = repository.findById(id)
            ?: return IngredientFout.NietGevonden(id).left()

        if (repository.existsByNaamIgnoreCaseAndIdNot(request.naam, id)) {
            return IngredientFout.NaamBestaatAl(request.naam).left()
        }
        val ingredient = bestaand.copy(
            naam = request.naam,
            eenheid = request.eenheid,
            aankoopprijs = request.aankoopprijs,
            categorie = request.categorie,
            voedingswaarden = request.voedingswaarden?.naarDomein(),
            allergenen = request.allergenen.map { it.naarDomein() }
        )

        return repository.save(ingredient)
            .also { events.publishEvent(IngredientEvent.Gewijzigd(ingredient)) }
            .naarResponse()
            .right()
    }

    @Transactional
    fun verwijder(id: UUID): Either<IngredientFout, Unit> {
        if (!repository.existsById(id)) return IngredientFout.NietGevonden(id).left()
        repository.deleteById(id)
        events.publishEvent(IngredientEvent.Verwijderd(id))
        return Unit.right()
    }

    fun zoekViaNutritionProvider(
        query: String,
        pagina: Int = 0,
        paginaGrootte: Int = 20,
        merk: String? = null
    ): Either<IngredientFout, NutritionZoekPagina> =
        Either.catch { nutritionProviderService.zoek(query, pagina, paginaGrootte, merk) }
            .mapLeft { IngredientFout.ExterneProviderFout(it.message ?: "Onbekende fout") }

    @Transactional
    fun importeerVanProvider(
        externeId: String,
        naam: String,
        eenheid: Eenheid,
        aankoopprijs: BigDecimal?
    ): Either<IngredientFout, IngredientResponse> =
        Either.catch { nutritionProviderService.haalDetail(externeId) }
            .mapLeft { IngredientFout.ExterneProviderFout(it.message ?: "Onbekende fout") }
            .map { detail ->
                Ingredient(
                    naam = naam,
                    eenheid = eenheid,
                    aankoopprijs = aankoopprijs,
                    categorie = detail.categorie,
                    voedingswaarden = detail.voedingswaarden,
                    allergenen = detail.allergenen
                ).let { repository.save(it) }
                    .also { events.publishEvent(IngredientEvent.Aangemaakt(it)) }
                    .naarResponse()
            }
}

private fun Ingredient.naarResponse() = IngredientResponse(
    id = id,
    naam = naam,
    eenheid = eenheid,
    aankoopprijs = aankoopprijs,
    categorie = categorie,
    voedingswaarden = voedingswaarden?.naarResponse(),
    allergenen = allergenen.map { IngredientAllergeenResponse(it.allergeen, it.aanwezigheid) }
)

private fun VoedingswaardePer100.naarResponse() = VoedingswaardenResponse(
    energie, eiwitten, koolhydraten, suikers, vetten, verzadigdVet, vezels, zout
)

private fun VoedingswaardenRequest.naarDomein() = VoedingswaardePer100(
    energie, eiwitten, koolhydraten, suikers, vetten, verzadigdVet, vezels, zout
)

private fun IngredientAllergeenRequest.naarDomein() = IngredientAllergeen(allergeen, aanwezigheid)
