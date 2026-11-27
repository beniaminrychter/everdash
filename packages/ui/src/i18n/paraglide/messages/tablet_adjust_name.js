/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Tablet_Adjust_NameInputs */



/**
* | output |
* | --- |
* | "Adjust {name}" |
*
* @param {Tablet_Adjust_NameInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_adjust_name = /** @type {((inputs: Tablet_Adjust_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Adjust_NameInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Dostosuj ${i?.name}`)
	return /** @type {LocalizedString} */ (`Adjust ${i?.name}`)
});