/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_None_FoundInputs */



/**
* | output |
* | --- |
* | "No Home Assistant instances found automatically. Enter your URL above or rescan." |
*
* @param {Admin_Signin_None_FoundInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_none_found = /** @type {((inputs?: Admin_Signin_None_FoundInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_None_FoundInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie wykryto automatycznie żadnej instancji Home Assistant. Wpisz adres URL powyżej lub przeskanuj ponownie.")
	return /** @type {LocalizedString} */ ("No Home Assistant instances found automatically. Enter your URL above or rescan.")
});