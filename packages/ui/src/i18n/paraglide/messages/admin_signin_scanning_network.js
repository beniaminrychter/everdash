/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Scanning_NetworkInputs */



/**
* | output |
* | --- |
* | "Scanning your home network for Home Assistant…" |
*
* @param {Admin_Signin_Scanning_NetworkInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_scanning_network = /** @type {((inputs?: Admin_Signin_Scanning_NetworkInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Scanning_NetworkInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Skanowanie sieci domowej w poszukiwaniu Home Assistant…")
	return /** @type {LocalizedString} */ ("Scanning your home network for Home Assistant…")
});