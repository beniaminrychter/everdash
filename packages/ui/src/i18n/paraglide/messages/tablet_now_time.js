/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ time: NonNullable<unknown> }} Tablet_Now_TimeInputs */



/**
* | output |
* | --- |
* | "Now {time}" |
*
* @param {Tablet_Now_TimeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_now_time = /** @type {((inputs: Tablet_Now_TimeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Now_TimeInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Teraz ${i?.time}`)
	return /** @type {LocalizedString} */ (`Now ${i?.time}`)
});