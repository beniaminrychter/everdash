/**
* | output |
* | --- |
* | "Valid JSON · {count} line" |
*
*/
export const admin_json_valid_lines_one: ((inputs: Admin_Json_Valid_Lines_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Json_Valid_Lines_OneInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Json_Valid_Lines_OneInputs = { count: NonNullable<unknown> };
