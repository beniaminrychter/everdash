/**
* | output |
* | --- |
* | "Adjust {name}" |
*
*/
export const tablet_adjust_name: ((inputs: Tablet_Adjust_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Adjust_NameInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Adjust_NameInputs = { name: NonNullable<unknown> };
