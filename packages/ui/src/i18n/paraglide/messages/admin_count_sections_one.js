/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Count_Sections_OneInputs */



/**
* | output |
* | --- |
* | "{count} section" |
*
* @param {Admin_Count_Sections_OneInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_count_sections_one = /** @type {((inputs: Admin_Count_Sections_OneInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Count_Sections_OneInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.count} sekcja`)
	return /** @type {LocalizedString} */ (`${i?.count} section`)
});