/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Count_Cards_ManyInputs */



/**
* | output |
* | --- |
* | "{count} cards" |
*
* @param {Admin_Count_Cards_ManyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_count_cards_many = /** @type {((inputs: Admin_Count_Cards_ManyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Count_Cards_ManyInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.count} kart`)
	return /** @type {LocalizedString} */ (`${i?.count} cards`)
});