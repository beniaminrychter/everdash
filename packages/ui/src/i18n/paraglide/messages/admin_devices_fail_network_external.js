/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Network_ExternalInputs */



/**
* | output |
* | --- |
* | "The server could not reach this external address from its network." |
*
* @param {Admin_Devices_Fail_Network_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_network_external = /** @type {((inputs?: Admin_Devices_Fail_Network_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Network_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Serwer nie mógł połączyć się z tym adresem zewnętrznym ze swojej sieci.")
	return /** @type {LocalizedString} */ ("The server could not reach this external address from its network.")
});