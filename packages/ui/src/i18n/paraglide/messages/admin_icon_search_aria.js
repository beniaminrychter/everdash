/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ label: NonNullable<unknown> }} Admin_Icon_Search_AriaInputs */



/**
* | output |
* | --- |
* | "Search {label}s" |
*
* @param {Admin_Icon_Search_AriaInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_search_aria = /** @type {((inputs: Admin_Icon_Search_AriaInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_Search_AriaInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Szukaj: ${i?.label}`)
	return /** @type {LocalizedString} */ (`Search ${i?.label}s`)
});