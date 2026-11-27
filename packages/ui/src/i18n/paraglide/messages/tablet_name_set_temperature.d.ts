/**
* | output |
* | --- |
* | "{name} set temperature" |
*
*/
export const tablet_name_set_temperature: ((inputs: Tablet_Name_Set_TemperatureInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Name_Set_TemperatureInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Name_Set_TemperatureInputs = { name: NonNullable<unknown> };
