// Standalone entry point for Replit "Scheduled Deployment".
// Runs all periodic background jobs ONCE and exits, instead of keeping
// the main autoscale web server alive 24/7 via in-process cron timers.
// Configure a Replit Scheduled Deployment to run this hourly:
//   command: node dist/scheduledJobs.js
//   schedule: every hour (e.g. "0 * * * *")
import "dotenv/config";

async function runWeeklyEmailCheck() {
  try {
    const { getWeeklyEmailConfig, sendWeeklyEmail } = await import("./weeklyEmailService");
    const cfg = await getWeeklyEmailConfig();
    if (!cfg.enabled) return;

    const now = new Date();
    const ukHour = parseInt(now.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/London" }), 10);
    const ukDay  = parseInt(now.toLocaleString("en-GB", { weekday: "short",  timeZone: "Europe/London" }) === "Sun" ? "0"
      : now.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" }) === "Monday" ? "1"
      : now.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" }) === "Tuesday" ? "2"
      : now.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" }) === "Wednesday" ? "3"
      : now.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" }) === "Thursday" ? "4"
      : now.toLocaleString("en-GB", { weekday: "long", timeZone: "Europe/London" }) === "Friday" ? "5" : "6", 10);

    if (ukDay !== cfg.sendDayOfWeek || ukHour !== cfg.sendHour) return;

    if (cfg.lastSentAt) {
      const msSince = Date.now() - new Date(cfg.lastSentAt).getTime();
      if (msSince < 23 * 60 * 60 * 1000) {
        console.log("[WeeklyEmail] Already sent within last 23h — skipping");
        return;
      }
    }

    console.log("[WeeklyEmail] Scheduled send triggered");
    await sendWeeklyEmail("scheduler");
  } catch (err) {
    console.error("[WeeklyEmail] Job error:", err);
  }
}

async function runReviewRequests() {
  try {
    const { processReviewRequests, processReviewReminders, processReviewThankYou } = await import("./reviewRequestService");
    await processReviewRequests();
    await processReviewReminders();
    await processReviewThankYou();
  } catch (err) {
    console.error("[ReviewRequest] Job error:", err);
  }
}

async function runCustomerSmsReminders() {
  try {
    const { processCustomerSmsReminders } = await import("./customerSmsReminderService");
    await processCustomerSmsReminders();
  } catch (err) {
    console.error("[CustomerSmsReminder] Job error:", err);
  }
}

async function runAutomations() {
  try {
    const { processAllAutomations } = await import("./automationService");
    await processAllAutomations();
  } catch (err) {
    console.error("[Automation] Job error:", err);
  }
}

(async () => {
  console.log("[ScheduledJobs] Run started at", new Date().toISOString());

  await runWeeklyEmailCheck();

  // Review requests only need to run every 6 hours — only run on hours
  // divisible by 6 when this script itself is triggered hourly.
  const hour = new Date().getUTCHours();
  if (hour % 6 === 0) {
    await runReviewRequests();
  }

  // Manual-SMS follow-ups run every hour so a 24h no-reply gap is caught promptly.
  await runCustomerSmsReminders();

  await runAutomations();

  console.log("[ScheduledJobs] Run complete at", new Date().toISOString());
  process.exit(0);
})().catch((err) => {
  console.error("[ScheduledJobs] Fatal error:", err);
  process.exit(1);
});
