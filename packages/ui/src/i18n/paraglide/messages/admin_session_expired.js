/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Session_ExpiredInputs */



/**
* | output |
* | --- |
* | "Your session has expired. Sign in again." |
*
* @param {Admin_Session_ExpiredInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_session_expired = /** @type {((inputs?: Admin_Session_ExpiredInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Session_ExpiredInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Twoja sesja wygasła. Zaloguj się ponownie.")
	return /** @type {LocalizedString} */ ("Your session has expired. Sign in again.")
});