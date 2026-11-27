/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Auth_Invalid_RequestInputs */



/**
* | output |
* | --- |
* | "The login request was not valid or has expired. Check the address and try again." |
*
* @param {Admin_Auth_Invalid_RequestInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_auth_invalid_request = /** @type {((inputs?: Admin_Auth_Invalid_RequestInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Auth_Invalid_RequestInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Żądanie logowania jest nieprawidłowe lub wygasło. Sprawdź adres i spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("The login request was not valid or has expired. Check the address and try again.")
});