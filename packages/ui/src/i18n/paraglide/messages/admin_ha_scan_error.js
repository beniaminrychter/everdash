/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Scan_ErrorInputs */



/**
* | output |
* | --- |
* | "Could not scan the local network for Home Assistant." |
*
* @param {Admin_Ha_Scan_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_scan_error = /** @type {((inputs?: Admin_Ha_Scan_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Scan_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się przeskanować sieci lokalnej w poszukiwaniu Home Assistant.")
	return /** @type {LocalizedString} */ ("Could not scan the local network for Home Assistant.")
});