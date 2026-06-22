package be.foodmanager

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class FoodManagerApplication

fun main(args: Array<String>) {
    runApplication<FoodManagerApplication>(*args)
}
