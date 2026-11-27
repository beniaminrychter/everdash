/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Unknown_ExternalInputs */



/**
* | output |
* | --- |
* | "The server could not verify this external address. External tunnels usually forward only Home Assistant, not the EverDash tablet port." |
*
* @param {Admin_Devices_Fail_Unknown_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_unknown_external = /** @type {((inputs?: Admin_Devices_Fail_Unknown_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Unknown_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Serwer nie mógł zweryfikować tego adresu zewnętrznego. Zewnętrzne tunele zwykle przekierowują tylko Home Assistant, a nie port tabletu EverDash.")
	return /** @type {LocalizedString} */ ("The server could not verify this external address. External tunnels usually forward only Home Assistant, not the EverDash tablet port.")
});