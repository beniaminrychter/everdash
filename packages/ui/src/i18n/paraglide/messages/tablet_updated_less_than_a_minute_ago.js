/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Updated_Less_Than_A_Minute_AgoInputs */



/**
* | output |
* | --- |
* | "Updated less than a minute ago" |
*
* @param {Tablet_Updated_Less_Than_A_Minute_AgoInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_updated_less_than_a_minute_ago = /** @type {((inputs?: Tablet_Updated_Less_Than_A_Minute_AgoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Updated_Less_Than_A_Minute_AgoInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zaktualizowano mniej niż minutę temu")
	return /** @type {LocalizedString} */ ("Updated less than a minute ago")
});