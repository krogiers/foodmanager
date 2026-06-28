package be.foodmanager.label

import be.foodmanager.label.dto.LabelsjabloonAanmakenRequest
import be.foodmanager.label.dto.LabelsjabloonWijzigenRequest
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/labels")
class LabelController(private val service: LabelService) {

    @GetMapping
    fun haalAlleOp() = service.haalAlleOp()

    @GetMapping("/{id}")
    fun haalOp(@PathVariable id: UUID) = service.haalOp(id).fold(
        ifLeft  = { it.naarResponse() },
        ifRight = { ResponseEntity.ok(it) }
    )

    @PostMapping
    fun maakAan(@RequestBody request: LabelsjabloonAanmakenRequest) = service.maakAan(request).fold(
        ifLeft  = { it.naarResponse() },
        ifRight = { ResponseEntity.status(HttpStatus.CREATED).body(it) }
    )

    @PutMapping("/{id}")
    fun wijzig(@PathVariable id: UUID, @RequestBody request: LabelsjabloonWijzigenRequest) =
        service.wijzig(id, request).fold(
            ifLeft  = { it.naarResponse() },
            ifRight = { ResponseEntity.ok(it) }
        )

    @DeleteMapping("/{id}")
    fun verwijder(@PathVariable id: UUID) = service.verwijder(id).fold(
        ifLeft  = { it.naarResponse() },
        ifRight = { ResponseEntity.noContent().build<Unit>() }
    )

    @GetMapping("/{id}/voorbeeld")
    fun voorbeeld(
        @PathVariable id: UUID,
        @RequestParam receptId: UUID,
        @RequestParam(defaultValue = "") houdbaarheid: String
    ) = service.genereerVoorbeeldHtml(id, receptId, houdbaarheid).fold(
        ifLeft  = { it.naarResponse() },
        ifRight = { html ->
            ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html)
        }
    )

    @GetMapping("/{id}/afdruk")
    fun afdruk(
        @PathVariable id: UUID,
        @RequestParam receptId: UUID,
        @RequestParam(defaultValue = "") houdbaarheid: String,
        @RequestParam(defaultValue = "1") aantalExemplaren: Int
    ) = service.genereerPdf(id, receptId, houdbaarheid, aantalExemplaren).fold(
        ifLeft  = { it.naarResponse() },
        ifRight = { pdf ->
            ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"label.pdf\"")
                .body(pdf)
        }
    )
}

private fun LabelFout.naarResponse(): ResponseEntity<Map<String, String>> = when (this) {
    is LabelFout.NietGevonden -> ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(mapOf("bericht" to "Labelsjabloon niet gevonden: $id"))
    is LabelFout.NaamBestaatAl -> ResponseEntity.status(HttpStatus.CONFLICT)
        .body(mapOf("bericht" to "Een sjabloon met de naam '$naam' bestaat al."))
    is LabelFout.ReceptNietGevonden -> ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(mapOf("bericht" to "Recept niet gevonden: $id"))
}
