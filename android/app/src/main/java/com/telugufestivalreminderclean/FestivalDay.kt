package com.telugufestivalreminderclean

data class FestivalDay(
    val date: String,
    val Thidi: String,
    val year: String,
    val festivals: List<String>,
    val category: String = "festival"
)