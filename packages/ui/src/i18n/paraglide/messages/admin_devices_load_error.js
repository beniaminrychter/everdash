/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Devices_Load_ErrorInputs */



/**
* | output |
* | --- |
* | "Unable to load registered devices." |
*
* @param {Admin_Devices_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_devices_load_error = /** @type {((inputs?: Admin_Devices_Load_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Devices_Load_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wczytać zarejestrowanych urządzeń.")
	return /** @type {LocalizedString} */ ("Unable to load registered devices.")
});