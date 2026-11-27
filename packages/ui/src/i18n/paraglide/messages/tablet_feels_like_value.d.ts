/**
* | output |
* | --- |
* | "Feels like {value}" |
*
*/
export const tablet_feels_like_value: ((inputs: Tablet_Feels_Like_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Feels_Like_ValueInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Feels_Like_ValueInputs = { value: NonNullable<unknown> };
