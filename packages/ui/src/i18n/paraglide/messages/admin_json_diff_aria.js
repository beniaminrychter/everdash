/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Diff_AriaInputs */



/**
* | output |
* | --- |
* | "Differences from saved dashboard JSON" |
*
* @param {Admin_Json_Diff_AriaInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_diff_aria = /** @type {((inputs?: Admin_Json_Diff_AriaInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Diff_AriaInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Różnice względem zapisanego JSON pulpitu")
	return /** @type {LocalizedString} */ ("Differences from saved dashboard JSON")
});