/**
* | output |
* | --- |
* | "Low {value}" |
*
*/
export const tablet_low_value: ((inputs: Tablet_Low_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Low_ValueInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Low_ValueInputs = { value: NonNullable<unknown> };
