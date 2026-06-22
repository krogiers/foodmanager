package be.foodmanager.klant.dto

import be.foodmanager.ingredient.Allergeen
import be.foodmanager.klant.Herkomst
import be.foodmanager.klant.VoorkeurContactwijze
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.Instant
import java.util.UUID

data class KlantAanmakenRequest(
    val voornaam: String? = null,
    @field:NotBlank val familienaam: String,
    @field:Email val email: String? = null,
    val telefoon: String? = null,
    val adres: AdresRequest? = null,
    val herkomst: Herkomst? = null,
    val herkomstToelichting: String? = null,
    @field:NotNull val voorkeurContactwijze: VoorkeurContactwijze,
    val allergenen: List<Allergeen> = emptyList(),
    val specialeEisen: List<String> = emptyList()
)

data class KlantWijzigenRequest(
    val voornaam: String? = null,
    @field:NotBlank val familienaam: String,
    @field:Email val email: String? = null,
    val telefoon: String? = null,
    val adres: AdresRequest? = null,
    val herkomst: Herkomst? = null,
    val herkomstToelichting: String? = null,
    @field:NotNull val voorkeurContactwijze: VoorkeurContactwijze,
    val allergenen: List<Allergeen> = emptyList(),
    val specialeEisen: List<String> = emptyList()
)

data class AdresRequest(
    @field:NotBlank val straat: String,
    @field:NotBlank val huisnummer: String,
    @field:NotBlank val gemeente: String,
    @field:NotBlank val postcode: String,
    val land: String = "België"
)

data class KlantResponse(
    val id: UUID,
    val voornaam: String?,
    val familienaam: String,
    val volledigNaam: String,
    val email: String?,
    val telefoon: String?,
    val adres: AdresResponse?,
    val herkomst: Herkomst?,
    val herkomstToelichting: String?,
    val voorkeurContactwijze: VoorkeurContactwijze,
    val allergenen: List<Allergeen>,
    val specialeEisen: List<SpecialeEisResponse>,
    val isGeanonimiseerd: Boolean,
    val aangemaaktOp: Instant
)

data class AdresResponse(
    val straat: String,
    val huisnummer: String,
    val gemeente: String,
    val postcode: String,
    val land: String
)

data class SpecialeEisResponse(
    val id: UUID,
    val omschrijving: String
)
