/**
* | output |
* | --- |
* | "EverDash request failed ({status})." |
*
*/
export const admin_request_failed: ((inputs: Admin_Request_FailedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Request_FailedInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Request_FailedInputs = { status: NonNullable<unknown> };
