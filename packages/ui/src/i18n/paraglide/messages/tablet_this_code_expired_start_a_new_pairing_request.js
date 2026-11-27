/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_This_Code_Expired_Start_A_New_Pairing_RequestInputs */



/**
* | output |
* | --- |
* | "This code expired. Start a new pairing request." |
*
* @param {Tablet_This_Code_Expired_Start_A_New_Pairing_RequestInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_this_code_expired_start_a_new_pairing_request = /** @type {((inputs?: Tablet_This_Code_Expired_Start_A_New_Pairing_RequestInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_This_Code_Expired_Start_A_New_Pairing_RequestInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Kod wygasł. Rozpocznij nowe parowanie.")
	return /** @type {LocalizedString} */ ("This code expired. Start a new pairing request.")
});