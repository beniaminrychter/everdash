/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pairing_Could_Not_Start_RetryInputs */



/**
* | output |
* | --- |
* | "Pairing could not start. Retry." |
*
* @param {Tablet_Pairing_Could_Not_Start_RetryInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pairing_could_not_start_retry = /** @type {((inputs?: Tablet_Pairing_Could_Not_Start_RetryInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pairing_Could_Not_Start_RetryInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się rozpocząć parowania. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Pairing could not start. Retry.")
});