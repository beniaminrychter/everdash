/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Dns_ExternalInputs */



/**
* | output |
* | --- |
* | "The server could not resolve this domain name. Check your DNS settings or use the local network address above." |
*
* @param {Admin_Devices_Fail_Dns_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_dns_external = /** @type {((inputs?: Admin_Devices_Fail_Dns_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Dns_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Serwer nie mógł rozpoznać tej nazwy domeny. Sprawdź ustawienia DNS lub użyj adresu lokalnego powyżej.")
	return /** @type {LocalizedString} */ ("The server could not resolve this domain name. Check your DNS settings or use the local network address above.")
});