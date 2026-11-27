/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Disconnect_ErrorInputs */



/**
* | output |
* | --- |
* | "Unable to disconnect Home Assistant." |
*
* @param {Admin_Ha_Disconnect_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_disconnect_error = /** @type {((inputs?: Admin_Ha_Disconnect_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Disconnect_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się rozłączyć Home Assistant.")
	return /** @type {LocalizedString} */ ("Unable to disconnect Home Assistant.")
});