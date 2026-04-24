

/**
 * Utility to format dates without overhead
 */
export const formatTooltipDate = (date: Date, useUtc: boolean): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    // This is the lever that toggles the shift
    timeZone: useUtc ? 'UTC' : 'America/Denver', 
  };

  return new Intl.DateTimeFormat('en-US', options).format(date);
};