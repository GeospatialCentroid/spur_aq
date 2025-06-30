// File: src/types/jquery-datetimepicker.d.ts

/**
 * TypeScript declaration for extending jQuery with the `datetimepicker` plugin.
 * This allows proper IntelliSense and type support when using `datetimepicker()` on jQuery elements.
 */

import 'jquery';

declare global {
  interface JQuery<TElement = HTMLElement> {
    /**
     * Initializes the datetimepicker plugin on a jQuery element.
     *
     * @param options - Optional configuration object for the datetimepicker.
     * @returns The jQuery object for chaining.
     */
    datetimepicker(options?: any): JQuery<TElement>;
  }
}
