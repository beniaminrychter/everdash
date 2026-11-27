/**
* | output |
* | --- |
* | "Updated {minutes} min ago" |
*
*/
export const tablet_updated_minutes_min_ago: ((inputs: Tablet_Updated_Minutes_Min_AgoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Updated_Minutes_Min_AgoInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Updated_Minutes_Min_AgoInputs = { minutes: NonNullable<unknown> };
