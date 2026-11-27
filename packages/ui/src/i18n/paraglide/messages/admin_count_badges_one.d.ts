/**
* | output |
* | --- |
* | "{count} badge" |
*
*/
export const admin_count_badges_one: ((inputs: Admin_Count_Badges_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Count_Badges_OneInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Count_Badges_OneInputs = { count: NonNullable<unknown> };
