/**
 * Utility functions for date handling and validation
 */

/**
 * Validates if a string can be parsed into a valid date
 * @param dateString - The date string to validate
 * @returns boolean indicating if the date is valid
 */
export const isValidDateString = (dateString: string): boolean => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  
  // Check if the date is valid and not NaN
  return !isNaN(date.getTime());
};

/**
 * Safely parses a date string and returns a valid Date object
 * If the date is invalid, returns the fallback date or current date
 * @param dateString - The date string to parse
 * @param fallbackDate - Optional fallback date to use if parsing fails
 * @returns A valid Date object
 */
export const safeParseDate = (dateString: string, fallbackDate?: Date): Date => {
  try {
    if (!dateString) {
      return fallbackDate || new Date();
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return fallbackDate || new Date();
    }
    
    return date;
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return fallbackDate || new Date();
  }
};

/**
 * Safely formats a date to ISO string
 * If the date is invalid, returns the fallback string or current date ISO string
 * @param date - The date to format
 * @param fallbackString - Optional fallback string to use if formatting fails
 * @returns A valid ISO date string
 */
export const safeFormatISOString = (date: Date | string, fallbackString?: string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return fallbackString || new Date().toISOString();
    }
    
    return dateObj.toISOString();
  } catch (error) {
    console.warn(`Error formatting date to ISO: ${date}`, error);
    return fallbackString || new Date().toISOString();
  }
};

/**
 * Creates a sequence of dates for fallback use
 * @param count - Number of dates to generate
 * @param startDate - Optional start date (defaults to current date)
 * @param intervalMinutes - Optional interval in minutes between dates (defaults to 60)
 * @returns Array of Date objects
 */
export const createSequentialDates = (
  count: number, 
  startDate: Date = new Date(), 
  intervalMinutes: number = 60
): Date[] => {
  const dates: Date[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    const date = new Date(start);
    date.setMinutes(date.getMinutes() + (i * intervalMinutes));
    dates.push(date);
  }
  
  return dates;
};

// Default export for the module
export default {
  isValidDateString,
  safeParseDate,
  safeFormatISOString,
  createSequentialDates
}; 