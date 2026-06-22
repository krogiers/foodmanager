package be.foodmanager.common

data class PagedResponse<T>(
    val content: List<T>,
    val totalElements: Long,
    val totalPages: Int,
    val page: Int,
    val size: Int
)

data class PageRequest(
    val page: Int = 0,
    val size: Int = 20,
    val sortBy: String = "naam",
    val sortDir: String = "ASC"
) {
    val offset: Long get() = page.toLong() * size

    fun totalPages(totalElements: Long): Int =
        if (totalElements == 0L) 0 else ((totalElements - 1) / size + 1).toInt()
}
