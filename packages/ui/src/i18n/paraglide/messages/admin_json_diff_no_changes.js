/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Diff_No_ChangesInputs */



/**
* | output |
* | --- |
* | "No unsaved changes compared to the saved dashboard JSON." |
*
* @param {Admin_Json_Diff_No_ChangesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_diff_no_changes = /** @type {((inputs?: Admin_Json_Diff_No_ChangesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Diff_No_ChangesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak niezapisanych zmian względem zapisanego JSON pulpitu.")
	return /** @type {LocalizedString} */ ("No unsaved changes compared to the saved dashboard JSON.")
});