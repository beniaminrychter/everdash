/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Signin_DescriptionInputs */



/**
* | output |
* | --- |
* | "Sign in with a Home Assistant administrator account." |
*
* @param {Admin_Signin_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_signin_description = /** @type {((inputs?: Admin_Signin_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Signin_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zaloguj się za pomocą konta administratora Home Assistant.")
	return /** @type {LocalizedString} */ ("Sign in with a Home Assistant administrator account.")
});