/**
* | output |
* | --- |
* | "{count} section" |
*
*/
export const admin_count_sections_one: ((inputs: Admin_Count_Sections_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Sections_OneInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Sections_OneInputs = { count: NonNullable<unknown> };
