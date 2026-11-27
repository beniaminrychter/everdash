/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ value: NonNullable<unknown> }} Tablet_Feels_Like_ValueInputs */



/**
* | output |
* | --- |
* | "Feels like {value}" |
*
* @param {Tablet_Feels_Like_ValueInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_feels_like_value = /** @type {((inputs: Tablet_Feels_Like_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Feels_Like_ValueInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Odczuwalna ${i?.value}`)
	return /** @type {LocalizedString} */ (`Feels like ${i?.value}`)
});