/**
* | output |
* | --- |
* | "Another service responded at this address (HTTP {status}) instead of EverDash. Your reverse proxy or tunnel may be forwarding this address to a different app." |
*
*/
export const admin_devices_fail_wrong_service_external_status: ((inputs: Admin_Devices_Fail_Wrong_Service_External_StatusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Devices_Fail_Wrong_Service_External_StatusInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Devices_Fail_Wrong_Service_External_StatusInputs = { status: NonNullable<unknown> };
