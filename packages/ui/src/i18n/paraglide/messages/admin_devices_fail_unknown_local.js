/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Fail_Unknown_LocalInputs */



/**
* | output |
* | --- |
* | "The server could not verify this address. Check your network and port configuration." |
*
* @param {Admin_Devices_Fail_Unknown_LocalInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_fail_unknown_local = /** @type {((inputs?: Admin_Devices_Fail_Unknown_LocalInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Fail_Unknown_LocalInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Serwer nie mógł zweryfikować tego adresu. Sprawdź konfigurację sieci i portu.")
	return /** @type {LocalizedString} */ ("The server could not verify this address. Check your network and port configuration.")
});