/**
* | output |
* | --- |
* | "Your session has expired. Sign in again." |
*
*/
export const admin_session_expired: ((inputs?: Admin_Session_ExpiredInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Session_ExpiredInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Session_ExpiredInputs = {};
