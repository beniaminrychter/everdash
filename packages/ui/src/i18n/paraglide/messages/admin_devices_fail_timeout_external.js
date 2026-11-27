/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Timeout_ExternalInputs */



/**
* | output |
* | --- |
* | "Timed out waiting for a response. External tunnels and routers usually do not forward the EverDash tablet port. Use the local network address above for table..." |
*
* @param {Admin_Devices_Fail_Timeout_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_timeout_external = /** @type {((inputs?: Admin_Devices_Fail_Timeout_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Timeout_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przekroczono czas oczekiwania na odpowiedź. Zewnętrzne tunele i routery zwykle nie przekierowują portu tabletu EverDash. Dla tabletów w sieci domowej użyj adresu lokalnego powyżej.")
	return /** @type {LocalizedString} */ ("Timed out waiting for a response. External tunnels and routers usually do not forward the EverDash tablet port. Use the local network address above for tablets on your home network.")
});