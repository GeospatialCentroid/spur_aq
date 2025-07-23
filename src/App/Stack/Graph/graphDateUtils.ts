/** Utility: Get ISO string for midnight one week ago today */
export function getStartOfTodayOneWeekAgo(): string {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

/** Utility: Get ISO string for current time */
export function getNow(): string {
    return new Date().toISOString();
}