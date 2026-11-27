/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Diff_SummaryInputs */



/**
* | output |
* | --- |
* | "Comparing saved JSON with current unsaved changes" |
*
* @param {Admin_Json_Diff_SummaryInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_diff_summary = /** @type {((inputs?: Admin_Json_Diff_SummaryInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Diff_SummaryInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Porównanie zapisanego JSON z bieżącymi niezapisanymi zmianami")
	return /** @type {LocalizedString} */ ("Comparing saved JSON with current unsaved changes")
});