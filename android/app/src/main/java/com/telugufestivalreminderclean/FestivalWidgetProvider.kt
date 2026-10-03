package com.telugufestivalreminderclean

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews

class FestivalWidgetProvider : AppWidgetProvider() {

    private companion object {
        // Kept for compatibility with already scheduled broadcasts from older builds.
        const val ACTION_SHOW_EVENT = "com.telugufestivalreminderclean.ACTION_SHOW_EVENT"
        const val ACTION_SHOW_INFO = "com.telugufestivalreminderclean.ACTION_SHOW_INFO"
    }

    private fun categoryColor(category: String): Int {
        return when (WidgetUtils.normalizeCategory(category)) {
            "regionalHoliday" -> Color.parseColor("#5EEAD4")
            "nationalDay" -> Color.parseColor("#60A5FA")
            "vratam" -> Color.parseColor("#C4B5FD")
            else -> Color.parseColor("#FDBA74")
        }
    }

    private fun renderWidgets(
        context: Context,
        appWidgetManager: AppWidgetManager,
        widgetIds: IntArray,
        info: WidgetUtils.WidgetInfo
    ) {
        val labels = WidgetUtils.getLabels(context)
        val nearestEvent = info.nearestEvent
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val launchPendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        for (widgetId in widgetIds) {
            val views = RemoteViews(context.packageName, R.layout.festival_widget)
            views.setOnClickPendingIntent(R.id.widget_root, launchPendingIntent)

            // Keep the year and thidhi visible while showing the nearest event when available.
            views.setViewVisibility(R.id.tvYear, android.view.View.VISIBLE)
            views.setViewVisibility(R.id.tvThidi, android.view.View.VISIBLE)
            views.setTextViewText(R.id.tvThidi, "${labels.thidi}: ${info.thidi}")
            views.setTextViewText(R.id.tvYear, "${labels.year}: ${info.year}")
            views.setViewVisibility(
                R.id.tvFestivals,
                if (nearestEvent == null) android.view.View.GONE else android.view.View.VISIBLE
            )

            if (nearestEvent != null) {
                views.setTextViewText(R.id.tvFestivals, nearestEvent.text)
                views.setTextColor(R.id.tvFestivals, categoryColor(nearestEvent.category))
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    private fun updateAllWidgets(context: Context) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val thisWidget = ComponentName(context, FestivalWidgetProvider::class.java)
        val widgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
        if (widgetIds.isEmpty()) return

        val info = WidgetUtils.getWidgetInfo(context)
        renderWidgets(context, appWidgetManager, widgetIds, info)
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, widgetIds: IntArray) {
        updateAllWidgets(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_SHOW_EVENT,
            ACTION_SHOW_INFO,
            Intent.ACTION_DATE_CHANGED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED,
            Intent.ACTION_BOOT_COMPLETED -> updateAllWidgets(context)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        updateAllWidgets(context)
    }
}