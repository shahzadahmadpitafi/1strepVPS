// Command-line entry for the batched weekly email.
//   npx tsx server/sendWeeklyBatch.ts <campaign-name> <max-emails-this-run>
// Safe to run repeatedly: it only mails people not yet mailed for this campaign.
import "dotenv/config";
import { sendWeeklyBatch } from "./weeklyEmailService";

(async () => {
  const [campaign, limitArg] = process.argv.slice(2);
  const limit = parseInt(limitArg ?? "", 10);
  if (!campaign || !Number.isFinite(limit) || limit <= 0) {
    console.error("Usage: tsx server/sendWeeklyBatch.ts <campaign> <limit>");
    process.exit(1);
  }
  const result = await sendWeeklyBatch({ campaign, limit });
  console.log("RESULT", JSON.stringify(result));
  process.exit(result.aborted ? 2 : 0);
})();
