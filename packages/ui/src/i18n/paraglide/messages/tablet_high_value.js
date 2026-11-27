/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ value: NonNullable<unknown> }} Tablet_High_ValueInputs */



/**
* | output |
* | --- |
* | "High {value}" |
*
* @param {Tablet_High_ValueInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_high_value = /** @type {((inputs: Tablet_High_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_High_ValueInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Maks. ${i?.value}`)
	return /** @type {LocalizedString} */ (`High ${i?.value}`)
});