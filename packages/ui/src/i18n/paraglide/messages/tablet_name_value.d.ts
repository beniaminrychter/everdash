/**
* | output |
* | --- |
* | "{name}: {value}" |
*
*/
export const tablet_name_value: ((inputs: Tablet_Name_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Name_ValueInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Name_ValueInputs = { name: NonNullable<unknown>, value: NonNullable<unknown> };
