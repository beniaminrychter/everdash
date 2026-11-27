/**
* | output |
* | --- |
* | "Current weather" |
*
*/
export const tablet_current_weather: ((inputs?: Tablet_Current_WeatherInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Current_WeatherInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Current_WeatherInputs = {};
