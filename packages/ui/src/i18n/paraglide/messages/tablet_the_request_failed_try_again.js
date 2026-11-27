/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_The_Request_Failed_Try_AgainInputs */



/**
* | output |
* | --- |
* | "The request failed. Try again." |
*
* @param {Tablet_The_Request_Failed_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_the_request_failed_try_again = /** @type {((inputs?: Tablet_The_Request_Failed_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_The_Request_Failed_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Żądanie nie powiodło się. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("The request failed. Try again.")
});