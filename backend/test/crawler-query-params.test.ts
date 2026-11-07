import assert from 'assert';

import {
  CRAWLER_HISTORY_DEFAULT_LIMIT,
  CRAWLER_HISTORY_MAX_LIMIT,
  CRAWLER_METRICS_DEFAULT_HOURS,
  CRAWLER_METRICS_MAX_HOURS,
  parsePositiveBoundedNumber,
} from '../src/utils/crawlerQueryParams';

function assertInvalid(
  value: string | null,
  parameter: string,
  defaultValue: number,
  maximum: number,
  integerOnly = false,
): void {
  assert.throws(
    () => parsePositiveBoundedNumber(value, parameter, defaultValue, maximum, integerOnly),
    new RegExp(`Invalid ${parameter} parameter`),
  );
}

assert.equal(parsePositiveBoundedNumber(null, 'limit', CRAWLER_HISTORY_DEFAULT_LIMIT, CRAWLER_HISTORY_MAX_LIMIT, true),100);
assert.equal(parsePositiveBoundedNumber(null, 'hours', CRAWLER_METRICS_DEFAULT_HOURS, CRAWLER_METRICS_MAX_HOURS),24);

assert.equal(parsePositiveBoundedNumber('1', 'limit', 100, 1_000, true), 1);
assert.equal(parsePositiveBoundedNumber('50', 'limit', 100, 1_000, true), 50);
assert.equal(parsePositiveBoundedNumber('1000', 'limit', 100, 1_000, true), 1_000);

assert.equal(parsePositiveBoundedNumber('1', 'hours', 24, 720), 1);
assert.equal(parsePositiveBoundedNumber('12', 'hours', 24, 720), 12);
assert.equal(parsePositiveBoundedNumber('12.5', 'hours', 24, 720), 12.5);
assert.equal(parsePositiveBoundedNumber('.5', 'hours', 24, 720), 0.5);
assert.equal(parsePositiveBoundedNumber('720', 'hours', 24, 720), 720);

for (const value of ['abc', '', '   ', '10abc', '1.2.3', '1e3']) {
  assertInvalid(value, 'limit', 100, 1_000, true);
  assertInvalid(value, 'hours', 24, 720);
}

assertInvalid('-1', 'limit', 100, 1_000, true);
assertInvalid('-0.5', 'hours', 24, 720);

assertInvalid('0', 'limit', 100, 1_000, true);
assertInvalid('0', 'hours', 24, 720);

assertInvalid('1.5', 'limit', 100, 1_000, true);

assertInvalid('1001', 'limit', 100, 1_000, true);
assertInvalid('721', 'hours', 24, 720);
assertInvalid('999999999999999999999999999999999999', 'limit', 100, 1_000, true);

assert.equal(parsePositiveBoundedNumber(' 25 ', 'limit', 100, 1_000, true), 25);
assert.equal(parsePositiveBoundedNumber(' 2.5 ', 'hours', 24, 720), 2.5);

console.log('Crawler query parameter validation tests passed');
