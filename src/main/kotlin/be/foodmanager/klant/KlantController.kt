package be.foodmanager.klant

import be.foodmanager.common.PageRequest
import be.foodmanager.klant.dto.KlantAanmakenRequest
import be.foodmanager.klant.dto.KlantWijzigenRequest
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/klanten")
class KlantController(private val service: KlantService) {

    @GetMapping
    fun zoekAlle(
        @RequestParam zoekterm: String? = null,
        @RequestParam herkomst: Herkomst? = null,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
        @RequestParam(defaultValue = "familienaam") sortBy: String,
        @RequestParam(defaultValue = "ASC") sortDir: String
    ) = service.zoekPaged(zoekterm, herkomst, PageRequest(page, size, sortBy, sortDir))

    @GetMapping("/{id}")
    fun haalOp(@PathVariable id: UUID): ResponseEntity<*> =
        service.haalOp(id).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.ok(it) }
        )

    @PostMapping
    fun maakAan(@Valid @RequestBody request: KlantAanmakenRequest): ResponseEntity<*> =
        service.maakAan(request).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.status(HttpStatus.CREATED).body(it) }
        )

    @PutMapping("/{id}")
    fun wijzig(@PathVariable id: UUID, @Valid @RequestBody request: KlantWijzigenRequest): ResponseEntity<*> =
        service.wijzig(id, request).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.ok(it) }
        )

    @DeleteMapping("/{id}")
    fun anonimiseer(@PathVariable id: UUID): ResponseEntity<*> =
        service.anonimiseer(id).fold(
            ifLeft = { it.naarResponseEntity() },
            ifRight = { ResponseEntity.noContent().build<Unit>() }
        )
}

private fun KlantFout.naarResponseEntity(): ResponseEntity<*> = when (this) {
    is KlantFout.NietGevonden -> ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(mapOf("bericht" to "Klant niet gevonden: $id"))
    is KlantFout.HeeftActieveReservaties -> ResponseEntity.status(HttpStatus.CONFLICT)
        .body(mapOf("bericht" to "Klant heeft nog actieve reservaties"))
    is KlantFout.ReedsGeanonimiseerd -> ResponseEntity.status(HttpStatus.CONFLICT)
        .body(mapOf("bericht" to "Klant is al geanonimiseerd"))
}
