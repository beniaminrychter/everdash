/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Dns_LocalInputs */



/**
* | output |
* | --- |
* | "The server could not resolve this hostname. Try using the IP address directly." |
*
* @param {Admin_Devices_Fail_Dns_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_dns_local = /** @type {((inputs?: Admin_Devices_Fail_Dns_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Dns_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Serwer nie mógł rozpoznać tej nazwy hosta. Spróbuj użyć bezpośrednio adresu IP.")
	return /** @type {LocalizedString} */ ("The server could not resolve this hostname. Try using the IP address directly.")
});