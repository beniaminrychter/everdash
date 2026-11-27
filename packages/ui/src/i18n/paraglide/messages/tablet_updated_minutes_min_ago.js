/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ minutes: NonNullable<unknown> }} Tablet_Updated_Minutes_Min_AgoInputs */



/**
* | output |
* | --- |
* | "Updated {minutes} min ago" |
*
* @param {Tablet_Updated_Minutes_Min_AgoInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_updated_minutes_min_ago = /** @type {((inputs: Tablet_Updated_Minutes_Min_AgoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Updated_Minutes_Min_AgoInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Zaktualizowano ${i?.minutes} min temu`)
	return /** @type {LocalizedString} */ (`Updated ${i?.minutes} min ago`)
});