// Defines the future ingestion schedule for source scraping jobs.
export type ScheduledTaskHandle = ReturnType<typeof setInterval>;

export function scheduleIngestionPipeline(task: () => Promise<void> | void, intervalMs = 60_000): ScheduledTaskHandle {
  return setInterval(() => {
    void task();
  }, intervalMs);
}