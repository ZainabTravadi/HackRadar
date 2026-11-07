export const CRAWLER_HISTORY_DEFAULT_LIMIT = 100;
export const CRAWLER_HISTORY_MAX_LIMIT = 1_000;
export const CRAWLER_METRICS_DEFAULT_HOURS = 24;
export const CRAWLER_METRICS_MAX_HOURS = 24 * 30;


export function parsePositiveBoundedNumber(
  value: string | null,
  parameter: string,
  defaultValue: number,
  maximum: number,
  integerOnly = false,
): number {
  if (value === null) return defaultValue;

  const normalized = value.trim();

  if (!normalized || !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    throw new Error(
      `Invalid ${parameter} parameter: must be a positive${integerOnly ? ' integer' : ' number'} no greater than ${maximum}.`,
    );
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > maximum || (integerOnly && !Number.isInteger(parsed))) {
    throw new Error(
      `Invalid ${parameter} parameter: must be a positive${integerOnly ? ' integer' : ' number'} no greater than ${maximum}.`,
    );
  }

  return parsed;
}
