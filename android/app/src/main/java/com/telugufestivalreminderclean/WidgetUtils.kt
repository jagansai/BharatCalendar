package com.telugufestivalreminderclean

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

object WidgetUtils {
    data class LocaleConfig(
        val today: String,
        val year: String,
        val thidi: String,
        val festivals: String,
        val noFestivalData: String,
        val months: List<String>,
        val weekdays: List<String>
    )

    data class WidgetInfo(
        val date: String,
        val thidi: String,
        val year: String,
        val nearestEvent: NextFestival?
    )

    data class NextFestival(
        val text: String,
        val category: String
    )
    fun readFestivalData(context: Context): List<FestivalDay> {
        val json = try {
            context.assets.open("festivals.json").bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            throw IllegalStateException("festivals.json not found in assets. Run scripts/build-android.ps1 with a language selection before building.", e)
        }
        val type = object : TypeToken<List<FestivalDay>>() {}.type
        return Gson().fromJson(json, type)
    }

    private fun readLocale(context: Context): LocaleConfig {
        val json = try {
            context.assets.open("locale.json").bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            throw IllegalStateException("locale.json not found in assets. Run scripts/build-android.ps1 with a language selection before building.", e)
        }
        return Gson().fromJson(json, LocaleConfig::class.java)
    }

    fun getLabels(context: Context): LocaleConfig = readLocale(context)

    fun normalizeCategory(value: String?): String {
        val normalized = value?.trim()?.lowercase(Locale.ROOT)?.replace(Regex("[\\s/_-]+"), "")
            ?: return "festival"
        return when (normalized) {
            "regional", "regionalholiday", "holiday" -> "regionalHoliday"
            "national", "nationalday" -> "nationalDay"
            "observance", "vratam", "vratamobservance", "utsavam" -> "vratam"
            else -> "festival"
        }
    }

    private fun getTodayAndNextTwoDates(): List<String> {
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val today = LocalDate.now()
        return (0..2).map { today.plusDays(it.toLong()).format(formatter) }
    }

    private fun extractIsoDate(fullDate: String): String? {
        return Regex("""\((\d{4}-\d{2}-\d{2})\)""").find(fullDate)?.groupValues?.get(1)
    }

    fun getUpcomingFestivals(context: Context): String {
        val allDays = readFestivalData(context)
        val language = readLocale(context)

        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val today = LocalDate.now()
        val todayIso = today.format(formatter)
        val next1Iso = today.plusDays(1).format(formatter)
        val next2Iso = today.plusDays(2).format(formatter)

        fun findDayByIso(iso: String): FestivalDay? =
            allDays.firstOrNull { extractIsoDate(it.date) == iso }

    val lines = mutableListOf<String>()

        // Today
        val todayDay = findDayByIso(todayIso)
        val todayFestivals = todayDay?.festivals?.filter { it.isNotBlank() } ?: emptyList()
        if (todayDay != null) {
            val thidi = todayDay.Thidi
            val year = todayDay.year
            val iso = extractIsoDate(todayDay.date) ?: todayIso
            lines += "${language.today}: ${formatDateFromIso(iso, language)}"
            lines += "${language.year}: ${year}"
            lines += "${language.thidi}: ${thidi}"
            if (todayFestivals.isNotEmpty()) {
                lines += "${language.festivals}: " + todayFestivals.joinToString(", ")
            }
        }

        // Next two days (only include days that actually have festivals)
        listOf(next1Iso, next2Iso).forEach { iso ->
            val d = findDayByIso(iso)
            if (d != null) {
                val fests = d.festivals.filter { it.isNotBlank() }
                if (fests.isNotEmpty()) {
                    // Show as: formatted date: first festival
                    val iso = extractIsoDate(d.date) ?: iso
                    lines += "${formatDateFromIso(iso, language)}: ${fests.first()}"
                }
            }
        }

        return if (lines.isNotEmpty()) lines.joinToString("\n")
        else language.noFestivalData
    }

    fun getWidgetInfo(context: Context): WidgetInfo {
        val allDays = readFestivalData(context)
        val language = readLocale(context)

        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val today = LocalDate.now()
        val todayIso = today.format(formatter)

        fun findDayByIso(iso: String): FestivalDay? =
            allDays.firstOrNull { extractIsoDate(it.date) == iso }

        val todayDay = findDayByIso(todayIso)
        val dateStr = if (todayDay != null) formatDateFromIso(extractIsoDate(todayDay.date) ?: todayIso, language) else formatDateFromIso(todayIso, language)
        val thidi = todayDay?.Thidi ?: ""
        val year = todayDay?.year ?: ""

        // Select the nearest event from today through the next two days.
        val nearestEvent = (0..2).asSequence()
            .mapNotNull { offset ->
                val iso = today.plusDays(offset.toLong()).format(formatter)
                val day = findDayByIso(iso) ?: return@mapNotNull null
                val festivals = day.festivals.filter { it.isNotBlank() }
                if (festivals.isEmpty()) return@mapNotNull null

                NextFestival(
                    text = festivals.first(),
                    category = normalizeCategory(day.category)
                )
            }
            .firstOrNull()

        return WidgetInfo(
            date = dateStr,
            thidi = thidi,
            year = year,
            nearestEvent = nearestEvent
        )
    }

        private fun formatDateFromIso(iso: String, language: LocaleConfig): String {
            try {
                val parts = iso.split('-')
                val y = parts[0].toInt()
                val m = parts[1].toInt()
                val d = parts[2].toInt()
                val monthName = language.months.getOrNull(m - 1) ?: ""
                val cal = java.time.LocalDate.of(y, m, d)
                val wk = cal.dayOfWeek.value % 7 // java: 1=Mon..7=Sun -> convert to 0=Sun
                val shortWeek = language.weekdays.getOrNull(wk) ?: ""
                return "$d $monthName, $y ($shortWeek)"
            } catch (e: Exception) {
                return iso
            }
        }
}