/**
* | output |
* | --- |
* | "{count} issues" |
*
*/
export const admin_json_issues_many: ((inputs: Admin_Json_Issues_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Issues_ManyInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Issues_ManyInputs = { count: NonNullable<unknown> };
