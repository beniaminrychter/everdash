/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Network_LocalInputs */



/**
* | output |
* | --- |
* | "This network address is not reachable from the server. Check your host network configuration." |
*
* @param {Admin_Devices_Fail_Network_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_network_local = /** @type {((inputs?: Admin_Devices_Fail_Network_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Network_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ten adres sieciowy nie jest osiągalny z serwera. Sprawdź konfigurację sieci hosta.")
	return /** @type {LocalizedString} */ ("This network address is not reachable from the server. Check your host network configuration.")
});