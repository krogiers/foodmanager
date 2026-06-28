package be.foodmanager.label.dto

import java.util.UUID

data class LabelsjabloonAanmakenRequest(
    val naam: String,
    val breedteMm: Int,
    val hoogteMm: Int,
    val htmlTemplate: String
)

data class LabelsjabloonWijzigenRequest(
    val naam: String,
    val breedteMm: Int,
    val hoogteMm: Int,
    val htmlTemplate: String
)

data class LabelsjabloonResponse(
    val id: UUID,
    val naam: String,
    val breedteMm: Int,
    val hoogteMm: Int,
    val htmlTemplate: String
)

data class LabelsjabloonSummaryResponse(
    val id: UUID,
    val naam: String,
    val breedteMm: Int,
    val hoogteMm: Int
)
