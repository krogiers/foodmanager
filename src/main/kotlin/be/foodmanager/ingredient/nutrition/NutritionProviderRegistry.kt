package be.foodmanager.ingredient.nutrition

import org.springframework.stereotype.Component

@Component
class NutritionProviderRegistry(providers: List<NutritionProvider>) {
    private val registry: Map<String, NutritionProvider> = providers.associateBy { it.providerNaam }

    fun haalOp(naam: String): NutritionProvider =
        registry[naam] ?: throw IllegalStateException("Nutrition provider '$naam' niet gevonden. Beschikbaar: ${registry.keys}")

    fun beschikbareProviders(): List<String> = registry.keys.toList()
}
