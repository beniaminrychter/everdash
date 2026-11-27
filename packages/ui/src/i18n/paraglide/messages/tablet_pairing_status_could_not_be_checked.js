/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pairing_Status_Could_Not_Be_CheckedInputs */



/**
* | output |
* | --- |
* | "Pairing status could not be checked." |
*
* @param {Tablet_Pairing_Status_Could_Not_Be_CheckedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pairing_status_could_not_be_checked = /** @type {((inputs?: Tablet_Pairing_Status_Could_Not_Be_CheckedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pairing_Status_Could_Not_Be_CheckedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się sprawdzić stanu parowania.")
	return /** @type {LocalizedString} */ ("Pairing status could not be checked.")
});