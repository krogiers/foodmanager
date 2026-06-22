package be.foodmanager.klant

import be.foodmanager.ingredient.Allergeen
import org.jetbrains.exposed.sql.ReferenceOption
import org.jetbrains.exposed.sql.Table
import org.jetbrains.exposed.sql.javatime.timestamp
import java.time.Instant
import java.util.UUID

enum class Herkomst { MOND_TOT_MOND, SOCIALE_MEDIA, WEBSITE, EVENT, ANDERE }
enum class VoorkeurContactwijze { EMAIL, TELEFOON, SMS, WHATSAPP, FACEBOOK, MESSENGER, INSTAGRAM }

object KlantenTable : Table("klanten") {
    val id = uuid("id")
    val voornaam = varchar("voornaam", 255).nullable()
    val familienaam = varchar("familienaam", 255)
    val email = varchar("email", 255).nullable()
    val telefoon = varchar("telefoon", 50).nullable()
    val straat = varchar("straat", 255).nullable()
    val huisnummer = varchar("huisnummer", 20).nullable()
    val gemeente = varchar("gemeente", 255).nullable()
    val postcode = varchar("postcode", 20).nullable()
    val land = varchar("land", 100).nullable()
    val herkomst = enumerationByName<Herkomst>("herkomst", 30).nullable()
    val herkomstToelichting = varchar("herkomst_toelichting", 500).nullable()
    val voorkeurContactwijze = enumerationByName<VoorkeurContactwijze>("voorkeur_contactwijze", 30)
    val isGeanonimiseerd = bool("is_geanonimiseerd").default(false)
    val aangemaaktOp = timestamp("aangemaakt_op")
    override val primaryKey = PrimaryKey(id)
}

object KlantAllergeenTable : Table("klant_allergenen") {
    val klantId = uuid("klant_id").references(KlantenTable.id, onDelete = ReferenceOption.CASCADE)
    val allergeen = enumerationByName<Allergeen>("allergeen", 50)
    override val primaryKey = PrimaryKey(klantId, allergeen)
}

object KlantSpecialeEisTable : Table("klant_speciale_eisen") {
    val id = uuid("id")
    val klantId = uuid("klant_id").references(KlantenTable.id, onDelete = ReferenceOption.CASCADE)
    val omschrijving = varchar("omschrijving", 1000)
    override val primaryKey = PrimaryKey(id)
}

data class Adres(
    val straat: String,
    val huisnummer: String,
    val gemeente: String,
    val postcode: String,
    val land: String = "België"
)

data class SpecialeEis(
    val id: UUID = UUID.randomUUID(),
    val omschrijving: String
)

data class Klant(
    val id: UUID = UUID.randomUUID(),
    val voornaam: String? = null,
    val familienaam: String,
    val email: String? = null,
    val telefoon: String? = null,
    val adres: Adres? = null,
    val herkomst: Herkomst? = null,
    val herkomstToelichting: String? = null,
    val voorkeurContactwijze: VoorkeurContactwijze,
    val allergenen: List<Allergeen> = emptyList(),
    val specialeEisen: List<SpecialeEis> = emptyList(),
    val isGeanonimiseerd: Boolean = false,
    val aangemaaktOp: Instant = Instant.now()
) {
    val volledigNaam: String get() = listOfNotNull(voornaam, familienaam).joinToString(" ")
}
