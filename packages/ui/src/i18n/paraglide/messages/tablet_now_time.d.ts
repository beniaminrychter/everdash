/**
* | output |
* | --- |
* | "Now {time}" |
*
*/
export const tablet_now_time: ((inputs: Tablet_Now_TimeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Now_TimeInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Now_TimeInputs = { time: NonNullable<unknown> };
