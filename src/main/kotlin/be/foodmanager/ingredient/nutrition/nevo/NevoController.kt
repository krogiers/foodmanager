package be.foodmanager.ingredient.nutrition.nevo

import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/admin/nevo")
class NevoController(
    private val importService: NevoImportService,
    private val provider: NevoProvider
) {

    @GetMapping("/status")
    fun status() = mapOf("aantalProducten" to provider.aantalProducten())

    @PostMapping("/importeer", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    fun importeer(@RequestParam("bestand") bestand: MultipartFile): ResponseEntity<Map<String, Any>> {
        if (bestand.isEmpty) return ResponseEntity.badRequest()
            .body(mapOf("bericht" to "Bestand is leeg."))

        val resultaat = importService.importeer(bestand.inputStream, bestand.originalFilename ?: "")
        return ResponseEntity.ok(mapOf(
            "geimporteerd" to resultaat.geimporteerd,
            "fouten"       to resultaat.fouten
        ))
    }
}
