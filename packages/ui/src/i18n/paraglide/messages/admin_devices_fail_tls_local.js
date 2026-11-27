/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Tls_LocalInputs */



/**
* | output |
* | --- |
* | "HTTPS/TLS handshake failed on this address." |
*
* @param {Admin_Devices_Fail_Tls_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_tls_local = /** @type {((inputs?: Admin_Devices_Fail_Tls_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Tls_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Błąd uzgadniania HTTPS/TLS pod tym adresem.")
	return /** @type {LocalizedString} */ ("HTTPS/TLS handshake failed on this address.")
});