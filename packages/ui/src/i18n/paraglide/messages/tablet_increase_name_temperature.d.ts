/**
* | output |
* | --- |
* | "Increase {name} temperature" |
*
*/
export const tablet_increase_name_temperature: ((inputs: Tablet_Increase_Name_TemperatureInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Increase_Name_TemperatureInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Increase_Name_TemperatureInputs = { name: NonNullable<unknown> };
