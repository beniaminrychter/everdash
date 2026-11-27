/**
* | output |
* | --- |
* | "{name} power" |
*
*/
export const tablet_name_power: ((inputs: Tablet_Name_PowerInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Name_PowerInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Name_PowerInputs = { name: NonNullable<unknown> };
