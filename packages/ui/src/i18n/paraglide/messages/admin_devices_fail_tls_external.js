/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Tls_ExternalInputs */



/**
* | output |
* | --- |
* | "HTTPS/TLS handshake failed. Check the certificate configuration on your reverse proxy or tunnel." |
*
* @param {Admin_Devices_Fail_Tls_ExternalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_tls_external = /** @type {((inputs?: Admin_Devices_Fail_Tls_ExternalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Tls_ExternalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Błąd uzgadniania HTTPS/TLS. Sprawdź konfigurację certyfikatu w swoim tunelu lub serwerze proxy.")
	return /** @type {LocalizedString} */ ("HTTPS/TLS handshake failed. Check the certificate configuration on your reverse proxy or tunnel.")
});