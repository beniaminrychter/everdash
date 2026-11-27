/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Incorrect_Pin_Try_AgainInputs */



/**
* | output |
* | --- |
* | "Incorrect PIN. Try again." |
*
* @param {Tablet_Incorrect_Pin_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_incorrect_pin_try_again = /** @type {((inputs?: Tablet_Incorrect_Pin_Try_AgainInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Incorrect_Pin_Try_AgainInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nieprawidłowy PIN. Spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Incorrect PIN. Try again.")
});