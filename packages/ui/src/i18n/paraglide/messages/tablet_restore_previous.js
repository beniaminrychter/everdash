/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Restore_PreviousInputs */



/**
* | output |
* | --- |
* | "Restore previous" |
*
* @param {Tablet_Restore_PreviousInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_restore_previous = /** @type {((inputs?: Tablet_Restore_PreviousInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Restore_PreviousInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przywróć poprzedni")
	return /** @type {LocalizedString} */ ("Restore previous")
});