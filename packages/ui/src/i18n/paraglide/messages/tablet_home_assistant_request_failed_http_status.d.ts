/**
* | output |
* | --- |
* | "Home Assistant request failed (HTTP {status})." |
*
*/
export const tablet_home_assistant_request_failed_http_status: ((inputs: Tablet_Home_Assistant_Request_Failed_Http_StatusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Tablet_Home_Assistant_Request_Failed_Http_StatusInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Tablet_Home_Assistant_Request_Failed_Http_StatusInputs = { status: NonNullable<unknown> };
