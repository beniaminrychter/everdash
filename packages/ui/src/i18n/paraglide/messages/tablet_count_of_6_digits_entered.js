/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Tablet_Count_Of_6_Digits_EnteredInputs */



/**
* | output |
* | --- |
* | "{count} of 6 digits entered" |
*
* @param {Tablet_Count_Of_6_Digits_EnteredInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_count_of_6_digits_entered = /** @type {((inputs: Tablet_Count_Of_6_Digits_EnteredInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Count_Of_6_Digits_EnteredInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Wpisano cyfr: ${i?.count} z 6`)
	return /** @type {LocalizedString} */ (`${i?.count} of 6 digits entered`)
});