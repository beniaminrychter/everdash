/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Scan_UnavailableInputs */



/**
* | output |
* | --- |
* | "Automatic network scan was unavailable. Enter your Home Assistant URL above." |
*
* @param {Admin_Signin_Scan_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_scan_unavailable = /** @type {((inputs?: Admin_Signin_Scan_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Scan_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Automatyczne skanowanie sieci jest niedostępne. Wpisz adres URL Home Assistant powyżej.")
	return /** @type {LocalizedString} */ ("Automatic network scan was unavailable. Enter your Home Assistant URL above.")
});