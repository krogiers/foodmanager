package be.foodmanager.recept

import be.foodmanager.common.PageRequest
import be.foodmanager.recept.dto.ReceptAanmakenRequest
import be.foodmanager.recept.dto.ReceptWijzigenRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/recepten")
class ReceptController(private val service: ReceptService) {

    @GetMapping
    fun zoek(
        @RequestParam(required = false) naam: String?,
        @RequestParam(defaultValue = "0") pagina: Int,
        @RequestParam(defaultValue = "20") paginaGrootte: Int,
        @RequestParam(defaultValue = "naam") sorteerOp: String,
        @RequestParam(defaultValue = "ASC") sorteerRichting: String
    ) = service.zoekPaged(naam, PageRequest(pagina, paginaGrootte, sorteerOp, sorteerRichting))

    @GetMapping("/{id}")
    fun haalOp(@PathVariable id: UUID) = service.haalOp(id).fold(
        ifLeft = { it.naarResponse() },
        ifRight = { ResponseEntity.ok(it) }
    )

    @PostMapping
    fun maakAan(@RequestBody request: ReceptAanmakenRequest) = service.maakAan(request).fold(
        ifLeft = { it.naarResponse() },
        ifRight = { ResponseEntity.status(HttpStatus.CREATED).body(it) }
    )

    @PutMapping("/{id}")
    fun wijzig(@PathVariable id: UUID, @RequestBody request: ReceptWijzigenRequest) = service.wijzig(id, request).fold(
        ifLeft = { it.naarResponse() },
        ifRight = { ResponseEntity.ok(it) }
    )

    @DeleteMapping("/{id}")
    fun verwijder(@PathVariable id: UUID) = service.verwijder(id).fold(
        ifLeft = { it.naarResponse() },
        ifRight = { ResponseEntity.noContent().build<Unit>() }
    )
}

private fun ReceptFout.naarResponse(): ResponseEntity<Map<String, String>> = when (this) {
    is ReceptFout.NietGevonden -> ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(mapOf("bericht" to "Recept niet gevonden: $id"))
    is ReceptFout.NaamBestaatAl -> ResponseEntity.status(HttpStatus.CONFLICT)
        .body(mapOf("bericht" to "Een recept met de naam '$naam' bestaat al."))
    is ReceptFout.CirkelReferentie -> ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(mapOf("bericht" to "Cirkelreferentie: '$subreceptNaam' bevat dit recept al."))
    is ReceptFout.InGebruik -> ResponseEntity.status(HttpStatus.CONFLICT)
        .body(mapOf("bericht" to "Recept '$naam' wordt gebruikt in andere recepten en kan niet verwijderd worden."))
    is ReceptFout.IngredientNietGevonden -> ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(mapOf("bericht" to "Ingrediënt niet gevonden: $id"))
    is ReceptFout.SubReceptNietGevonden -> ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(mapOf("bericht" to "Subrecept niet gevonden: $id"))
}
