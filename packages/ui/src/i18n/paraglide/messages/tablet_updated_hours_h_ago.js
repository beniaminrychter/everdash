/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ hours: NonNullable<unknown> }} Tablet_Updated_Hours_H_AgoInputs */



/**
* | output |
* | --- |
* | "Updated {hours} h ago" |
*
* @param {Tablet_Updated_Hours_H_AgoInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_updated_hours_h_ago = /** @type {((inputs: Tablet_Updated_Hours_H_AgoInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Updated_Hours_H_AgoInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Zaktualizowano ${i?.hours} godz. temu`)
	return /** @type {LocalizedString} */ (`Updated ${i?.hours} h ago`)
});