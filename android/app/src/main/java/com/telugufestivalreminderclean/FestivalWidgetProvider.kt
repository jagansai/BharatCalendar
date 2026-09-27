package com.telugufestivalreminderclean

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.util.TypedValue
import android.widget.RemoteViews
import java.util.Calendar

class FestivalWidgetProvider : AppWidgetProvider() {

    private fun categoryColor(category: String): Int {
        return when (WidgetUtils.normalizeCategory(category)) {
            "regionalHoliday" -> Color.parseColor("#5EEAD4")
            "nationalDay" -> Color.parseColor("#60A5FA")
            "vratam" -> Color.parseColor("#C4B5FD")
            else -> Color.parseColor("#FDBA74")
        }
    }

    private fun renderWidgets(context: Context, appWidgetManager: AppWidgetManager, widgetIds: IntArray) {
        val info = WidgetUtils.getWidgetInfo(context)
        for (widgetId in widgetIds) {
            val views = RemoteViews(context.packageName, R.layout.festival_widget)
            val labels = WidgetUtils.getLabels(context)

            val hasTodayEvent = info.todayFestivals.isNotEmpty()
            if (hasTodayEvent) {
                // On an event day, keep the widget focused on the event name only.
                views.setViewVisibility(R.id.tvDate, android.view.View.GONE)
                views.setViewVisibility(R.id.tvYear, android.view.View.GONE)
                views.setViewVisibility(R.id.tvThidi, android.view.View.GONE)
                views.setViewVisibility(R.id.tvNext, android.view.View.GONE)
                views.setViewVisibility(R.id.tvFestivals, android.view.View.VISIBLE)
                views.setTextViewText(R.id.tvFestivals, info.todayFestivals.joinToString("\n"))
                views.setTextColor(R.id.tvFestivals, categoryColor(info.todayCategory))
                val festivalTextSize = if (WidgetUtils.normalizeCategory(info.todayCategory) == "festival") 25f else 19f
                views.setTextViewTextSize(
                    R.id.tvFestivals,
                    TypedValue.COMPLEX_UNIT_SP,
                    festivalTextSize
                )
            } else {
                // On ordinary days, retain the date details and show upcoming events.
                views.setViewVisibility(R.id.tvDate, android.view.View.VISIBLE)
                views.setViewVisibility(R.id.tvYear, android.view.View.VISIBLE)
                views.setViewVisibility(R.id.tvThidi, android.view.View.VISIBLE)
                views.setTextViewText(R.id.tvDate, "${labels.today}: ${info.date}")
                views.setTextViewText(R.id.tvThidi, "${labels.thidi}: ${info.thidi}")
                views.setTextViewText(R.id.tvYear, "${labels.year}: ${info.year}")
                views.setViewVisibility(R.id.tvFestivals, android.view.View.GONE)
            }

            if (!hasTodayEvent && info.nextLines.isNotEmpty()) {
                views.setViewVisibility(R.id.tvNext, android.view.View.VISIBLE)
                val coloredLines = SpannableStringBuilder()
                info.nextLines.forEachIndexed { index, line ->
                    if (index > 0) coloredLines.append("\n")
                    val lineStart = coloredLines.length
                    coloredLines.append(line.text)
                    val separatorIndex = line.text.indexOf(": ")
                    if (separatorIndex >= 0) {
                        coloredLines.setSpan(
                            ForegroundColorSpan(categoryColor(line.category)),
                            lineStart + separatorIndex + 2,
                            coloredLines.length,
                            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                        )
                    }
                }
                views.setTextViewText(R.id.tvNext, coloredLines)
            } else {
                views.setViewVisibility(R.id.tvNext, android.view.View.GONE)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, widgetIds: IntArray) {
        renderWidgets(context, appWidgetManager, widgetIds)
    scheduleDailyUpdate(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            Intent.ACTION_DATE_CHANGED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_BOOT_COMPLETED,
            AppWidgetManager.ACTION_APPWIDGET_UPDATE -> {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val thisWidget = ComponentName(context, FestivalWidgetProvider::class.java)
                val ids = appWidgetManager.getAppWidgetIds(thisWidget)
                if (ids != null && ids.isNotEmpty()) {
                    renderWidgets(context, appWidgetManager, ids)
                }
                scheduleDailyUpdate(context)
            }
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        scheduleDailyUpdate(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        cancelDailyUpdate(context)
    }

    private fun scheduleDailyUpdate(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, FestivalWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pi = PendingIntent.getBroadcast(context, 0, intent, flags)

        val cal = Calendar.getInstance().apply {
            timeInMillis = System.currentTimeMillis()
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 5) // a few minutes after midnight
        }
        // Inexact repeating avoids exact alarm permission on Android 12+
        am.setInexactRepeating(AlarmManager.RTC, cal.timeInMillis, AlarmManager.INTERVAL_DAY, pi)
    }

    private fun cancelDailyUpdate(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, FestivalWidgetProvider::class.java).apply {
            action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pi = PendingIntent.getBroadcast(context, 0, intent, flags)
        am.cancel(pi)
    }
}