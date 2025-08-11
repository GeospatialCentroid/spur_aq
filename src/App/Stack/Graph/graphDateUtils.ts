import { DateTime } from 'luxon';

/** Utility: Get ISO string for midnight one week ago today in local time */
export function getStartOfTodayOneWeekAgo(): string | null {
    return DateTime.local().minus({ days: 7 }).startOf('day').toISO({ suppressMilliseconds: true });
}

/** Utility: Get ISO string for current local time */
export function getNow(): string | null {
    return DateTime.local().toISO({ suppressMilliseconds: true });
}

/** Utility: Get ISO string for midnight one week ago today in Mountain Time */
export function getStartOfTodayOneWeekAgoMountain(): string | null {
    return DateTime.now().setZone('America/Denver').minus({ days: 7 }).startOf('day').toISO({ suppressMilliseconds: true });
}

/** Utility: Get ISO string for current time in Mountain Time */
export function getNowMountain(): string | null {
    return DateTime.now().setZone('America/Denver').toISO({ suppressMilliseconds: true });
}