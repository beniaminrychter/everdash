/**
* | output |
* | --- |
* | "{error} The editor is using a starter dashboard. It can still create a new dashboard, or use JSON import / export to import a valid configuration." |
*
*/
export const admin_load_error_fallback: ((inputs: Admin_Load_Error_FallbackInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Load_Error_FallbackInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Load_Error_FallbackInputs = { error: NonNullable<unknown> };
