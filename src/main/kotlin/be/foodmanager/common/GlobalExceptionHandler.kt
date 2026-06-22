package be.foodmanager.common

import org.springframework.http.HttpStatus
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException::class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    fun handleValidatie(ex: MethodArgumentNotValidException): FoutResponse {
        val fouten = ex.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" }
        return FoutResponse("Validatiefout", fouten)
    }
}

data class FoutResponse(val bericht: String, val details: List<String> = emptyList())
