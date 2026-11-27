/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Icon_Search_PlaceholderInputs */



/**
* | output |
* | --- |
* | "Search icons" |
*
* @param {Admin_Icon_Search_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_search_placeholder = /** @type {((inputs?: Admin_Icon_Search_PlaceholderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_Search_PlaceholderInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Szukaj ikon")
	return /** @type {LocalizedString} */ ("Search icons")
});