// src/App/Stack/Graph/graphHandlers.ts

export function syncDateRange(
    newDate: string,
    anchorDate: string,
    isFrom: boolean
): [string, string] {
    const newTime = new Date(newDate).getTime();
    const anchorTime = new Date(anchorDate).getTime();

    if ((isFrom && newTime > anchorTime) || (!isFrom && newTime < anchorTime)) {
        return [newDate, anchorDate];
    } else {
        return isFrom ? [newDate, anchorDate] : [anchorDate, newDate];
    }
}

export function validateSliderRange(range: [number, number], minRange = 60_000): [number, number] | null {
    const [start, end] = range;
    return end - start >= minRange ? range : null;
}
