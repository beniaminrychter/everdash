/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Admin_Count_Sections_FewInputs */



/**
* | output |
* | --- |
* | "{count} sections" |
*
* @param {Admin_Count_Sections_FewInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_count_sections_few = /** @type {((inputs: Admin_Count_Sections_FewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Count_Sections_FewInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.count} sekcje`)
	return /** @type {LocalizedString} */ (`${i?.count} sections`)
});