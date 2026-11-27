/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Wrong_Service_ExternalInputs */



/**
* | output |
* | --- |
* | "Another service responded at this address instead of EverDash. Your reverse proxy or tunnel may be forwarding this address to a different app." |
*
* @param {Admin_Devices_Fail_Wrong_Service_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_wrong_service_external = /** @type {((inputs?: Admin_Devices_Fail_Wrong_Service_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Wrong_Service_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pod tym adresem odpowiedziała inna usługa zamiast EverDash. Twój tunel lub serwer proxy może kierować ten adres do innej aplikacji.")
	return /** @type {LocalizedString} */ ("Another service responded at this address instead of EverDash. Your reverse proxy or tunnel may be forwarding this address to a different app.")
});