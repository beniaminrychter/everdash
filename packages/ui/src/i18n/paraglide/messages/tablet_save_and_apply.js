/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Save_And_ApplyInputs */



/**
* | output |
* | --- |
* | "Save and apply" |
*
* @param {Tablet_Save_And_ApplyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_save_and_apply = /** @type {((inputs?: Tablet_Save_And_ApplyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Save_And_ApplyInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zapisz i zastosuj")
	return /** @type {LocalizedString} */ ("Save and apply")
});