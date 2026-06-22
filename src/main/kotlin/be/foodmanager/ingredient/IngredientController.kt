package be.foodmanager.ingredient

import be.foodmanager.common.PageRequest
import be.foodmanager.ingredient.dto.*
import be.foodmanager.ingredient.nutrition.NutritionProviderService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.util.UUID

@RestController
@RequestMapping("/api/ingredienten")
class IngredientController(
    private val service: IngredientService,
    private val nutritionProviderService: NutritionProviderService
) {
    @GetMapping
    fun zoekAlle(
        @RequestParam naam: String? = null,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "naam") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDir: String
    ) = service.zoekPaged(naam, PageRequest(page, size, sortBy, sortDir))

    @GetMapping("/{id}")
    fun haalOp(@PathVariable id: UUID): ResponseEntity<*> =
        service.haalOp(id).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.ok(it) }
        )

    @PostMapping
    fun maakAan(@Valid @RequestBody request: IngredientAanmakenRequest): ResponseEntity<*> =
        service.maakAan(request).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.status(HttpStatus.CREATED).body(it) }
        )

    @PutMapping("/{id}")
    fun wijzig(@PathVariable id: UUID, @Valid @RequestBody request: IngredientWijzigenRequest): ResponseEntity<*> =
        service.wijzig(id, request).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.ok(it) }
        )

    @DeleteMapping("/{id}")
    fun verwijder(@PathVariable id: UUID): ResponseEntity<*> =
        service.verwijder(id).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.noContent().build<Unit>() }
        )

    @GetMapping("/nutrition/zoek")
    fun zoekNutrition(@RequestParam query: String): ResponseEntity<*> =
        service.zoekViaNutritionProvider(query).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.ok(it) }
        )

    @PostMapping("/nutrition/importeer/{externeId}")
    fun importeerVanProvider(
        @PathVariable externeId: String,
        @RequestParam naam: String,
        @RequestParam eenheid: Eenheid,
        @RequestParam(required = false) aankoopprijs: BigDecimal?
    ): ResponseEntity<*> =
        service.importeerVanProvider(externeId, naam, eenheid, aankoopprijs).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.status(HttpStatus.CREATED).body(it) }
        )

    @GetMapping("/nutrition/providers")
    fun beschikbareProviders() = mapOf(
        "actief" to nutritionProviderService.actieveProviderNaam(),
        "beschikbaar" to nutritionProviderService.beschikbareProviders()
    )

    @PutMapping("/nutrition/providers/actief")
    fun wisselProvider(@RequestParam provider: String) =
        nutritionProviderService.wisselProvider(provider)
}

private fun IngredientFout.naarResponseEntity(): ResponseEntity<*> = when (this) {
    is IngredientFout.NietGevonden -> ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(mapOf("bericht" to "Ingredient niet gevonden: $id"))
    is IngredientFout.NaamBestaatAl -> ResponseEntity.status(HttpStatus.CONFLICT)
        .body(mapOf("bericht" to "Ingredient met naam '$naam' bestaat al"))
    is IngredientFout.ProviderNietGevonden -> ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(mapOf("bericht" to "Provider niet gevonden: $naam"))
    is IngredientFout.ExterneProviderFout -> ResponseEntity.status(HttpStatus.BAD_GATEWAY)
        .body(mapOf("bericht" to "Externe provider fout: $bericht"))
}
