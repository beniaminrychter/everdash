/**
* | output |
* | --- |
* | "{count} issue" |
*
*/
export const admin_json_issues_one: ((inputs: Admin_Json_Issues_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Issues_OneInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Issues_OneInputs = { count: NonNullable<unknown> };
