package be.foodmanager.ingredient.nutrition

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class NutritionProviderService(
    private val registry: NutritionProviderRegistry,
    private val instellingenRepository: ProviderInstellingenRepository
) {
    fun zoek(query: String): List<NutritionZoekResultaat> =
        actieveProvider().zoek(query)

    fun haalDetail(externeId: String): NutritionDetail =
        actieveProvider().haalDetail(externeId)

    fun actieveProviderNaam(): String =
        instellingenRepository.haalOp().actieveProvider

    @Transactional
    fun wisselProvider(providerNaam: String) {
        registry.haalOp(providerNaam)
        instellingenRepository.slaOp(ProviderInstellingen(providerNaam))
    }

    fun beschikbareProviders(): List<String> = registry.beschikbareProviders()

    private fun actieveProvider(): NutritionProvider =
        registry.haalOp(instellingenRepository.haalOp().actieveProvider)
}
