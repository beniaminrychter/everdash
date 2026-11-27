/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_View_Copy_SuffixInputs */



/**
* | output |
* | --- |
* | "copy" |
*
* @param {Admin_View_Copy_SuffixInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_view_copy_suffix = /** @type {((inputs?: Admin_View_Copy_SuffixInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_View_Copy_SuffixInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("kopia")
	return /** @type {LocalizedString} */ ("copy")
});