/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ value: NonNullable<unknown> }} Tablet_L_ValueInputs */



/**
* | output |
* | --- |
* | "L {value}" |
*
* @param {Tablet_L_ValueInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_l_value = /** @type {((inputs: Tablet_L_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_L_ValueInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`↓ ${i?.value}`)
	return /** @type {LocalizedString} */ (`L ${i?.value}`)
});