// src/types/jquery-datetimepicker.d.ts
import 'jquery';

declare global {
  interface JQuery<TElement = HTMLElement> {
    datetimepicker(options?: any): JQuery<TElement>;
  }
}
