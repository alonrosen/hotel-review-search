import prisma from "./db";

type LogLevel = "INFO" | "WARN" | "ERROR";

export async function logEvent(
  level: LogLevel,
  source: string,
  message: string,
  details?: any,
  hotelId?: string
) {
  try {
    let detailsString = null;
    if (details) {
      if (details instanceof Error) {
        detailsString = JSON.stringify({ name: details.name, message: details.message, stack: details.stack });
      } else if (typeof details === "string") {
        detailsString = details;
      } else {
        detailsString = JSON.stringify(details);
      }
    }

    await prisma.log.create({
      data: {
        level,
        source,
        message,
        details: detailsString,
        hotelId,
      },
    });

    // Fire and forget auto-cleanup
    cleanupLogs().catch(console.error);
  } catch (error) {
    console.error("Failed to write to DB log:", error);
  }
}

async function cleanupLogs() {
  try {
    const count = await prisma.log.count();
    if (count > 1000) {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      
      await prisma.log.deleteMany({
        where: {
          createdAt: {
            lt: twoMonthsAgo
          }
        }
      });
    }
  } catch (e) {
    console.error("Failed to auto-cleanup logs:", e);
  }
}
