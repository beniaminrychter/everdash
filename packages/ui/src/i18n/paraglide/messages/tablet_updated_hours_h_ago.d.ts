/**
* | output |
* | --- |
* | "Updated {hours} h ago" |
*
*/
export const tablet_updated_hours_h_ago: ((inputs: Tablet_Updated_Hours_H_AgoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Updated_Hours_H_AgoInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Updated_Hours_H_AgoInputs = { hours: NonNullable<unknown> };
