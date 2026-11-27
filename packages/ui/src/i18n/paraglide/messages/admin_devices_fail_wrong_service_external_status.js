/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ status: NonNullable<unknown> }} Admin_Devices_Fail_Wrong_Service_External_StatusInputs */



/**
* | output |
* | --- |
* | "Another service responded at this address (HTTP {status}) instead of EverDash. Your reverse proxy or tunnel may be forwarding this address to a different app." |
*
* @param {Admin_Devices_Fail_Wrong_Service_External_StatusInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_wrong_service_external_status = /** @type {((inputs: Admin_Devices_Fail_Wrong_Service_External_StatusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Wrong_Service_External_StatusInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Pod tym adresem odpowiedziała inna usługa (HTTP ${i?.status}) zamiast EverDash. Twój tunel lub serwer proxy może kierować ten adres do innej aplikacji.`)
	return /** @type {LocalizedString} */ (`Another service responded at this address (HTTP ${i?.status}) instead of EverDash. Your reverse proxy or tunnel may be forwarding this address to a different app.`)
});