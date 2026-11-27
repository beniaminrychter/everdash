/**
* | output |
* | --- |
* | "High {value}" |
*
*/
export const tablet_high_value: ((inputs: Tablet_High_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_High_ValueInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_High_ValueInputs = { value: NonNullable<unknown> };
