/**
* | output |
* | --- |
* | "{count} sections" |
*
*/
export const admin_count_sections_many: ((inputs: Admin_Count_Sections_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Sections_ManyInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Sections_ManyInputs = { count: NonNullable<unknown> };
