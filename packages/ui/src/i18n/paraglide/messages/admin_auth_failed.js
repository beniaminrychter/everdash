/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Auth_FailedInputs */



/**
* | output |
* | --- |
* | "Home Assistant login could not be completed. Please try again." |
*
* @param {Admin_Auth_FailedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_auth_failed = /** @type {((inputs?: Admin_Auth_FailedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Auth_FailedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się ukończyć logowania do Home Assistant. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Home Assistant login could not be completed. Please try again.")
});