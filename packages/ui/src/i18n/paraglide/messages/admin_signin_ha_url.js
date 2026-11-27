/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_Ha_UrlInputs */



/**
* | output |
* | --- |
* | "Home Assistant URL" |
*
* @param {Admin_Signin_Ha_UrlInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_ha_url = /** @type {((inputs?: Admin_Signin_Ha_UrlInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_Ha_UrlInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Adres URL Home Assistant")
	return /** @type {LocalizedString} */ ("Home Assistant URL")
});