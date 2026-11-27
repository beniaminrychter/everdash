/**
* | output |
* | --- |
* | "{count} badges" |
*
*/
export const admin_count_badges_many: ((inputs: Admin_Count_Badges_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Badges_ManyInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Badges_ManyInputs = { count: NonNullable<unknown> };
