/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Everdash_Did_Not_Respond_In_Time_Try_AgainInputs */



/**
* | output |
* | --- |
* | "EverDash did not respond in time. Try again." |
*
* @param {Tablet_Everdash_Did_Not_Respond_In_Time_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_everdash_did_not_respond_in_time_try_again = /** @type {((inputs?: Tablet_Everdash_Did_Not_Respond_In_Time_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Everdash_Did_Not_Respond_In_Time_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("EverDash nie odpowiedział na czas. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("EverDash did not respond in time. Try again.")
});