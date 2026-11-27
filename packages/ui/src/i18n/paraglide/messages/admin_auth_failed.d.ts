/**
* | output |
* | --- |
* | "Home Assistant login could not be completed. Please try again." |
*
*/
export const admin_auth_failed: ((inputs?: Admin_Auth_FailedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Auth_FailedInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Auth_FailedInputs = {};
