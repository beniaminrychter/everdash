/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Wrong_Service_LocalInputs */



/**
* | output |
* | --- |
* | "Another service responded at this address instead of EverDash. Check that the tablet port does not conflict with another app." |
*
* @param {Admin_Devices_Fail_Wrong_Service_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_wrong_service_local = /** @type {((inputs?: Admin_Devices_Fail_Wrong_Service_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Wrong_Service_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pod tym adresem odpowiedziała inna usługa zamiast EverDash. Sprawdź, czy port tabletu nie koliduje z inną aplikacją.")
	return /** @type {LocalizedString} */ ("Another service responded at this address instead of EverDash. Check that the tablet port does not conflict with another app.")
});