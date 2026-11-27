/**
* | output |
* | --- |
* | "Another service responded at this address (HTTP {status}) instead of EverDash. Check that the tablet port does not conflict with another app." |
*
*/
export const admin_devices_fail_wrong_service_local_status: ((inputs: Admin_Devices_Fail_Wrong_Service_Local_StatusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Devices_Fail_Wrong_Service_Local_StatusInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Devices_Fail_Wrong_Service_Local_StatusInputs = { status: NonNullable<unknown> };
