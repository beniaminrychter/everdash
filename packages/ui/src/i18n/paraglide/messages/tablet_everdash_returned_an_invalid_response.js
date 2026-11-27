/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Everdash_Returned_An_Invalid_ResponseInputs */



/**
* | output |
* | --- |
* | "EverDash returned an invalid response." |
*
* @param {Tablet_Everdash_Returned_An_Invalid_ResponseInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_everdash_returned_an_invalid_response = /** @type {((inputs?: Tablet_Everdash_Returned_An_Invalid_ResponseInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Everdash_Returned_An_Invalid_ResponseInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash zwrócił nieprawidłową odpowiedź.")
	return /** @type {LocalizedString} */ ("EverDash returned an invalid response.")
});