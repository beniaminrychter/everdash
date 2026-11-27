/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Unapplied_DescriptionInputs */



/**
* | output |
* | --- |
* | "Apply the JSON to the editor draft, or discard the raw edits before leaving this page." |
*
* @param {Admin_Json_Unapplied_DescriptionInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_unapplied_description = /** @type {((inputs?: Admin_Json_Unapplied_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Unapplied_DescriptionInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zastosuj zmiany JSON w wersji roboczej edytora albo odrzuć surowe modyfikacje przed opuszczeniem tej strony.")
	return /** @type {LocalizedString} */ ("Apply the JSON to the editor draft, or discard the raw edits before leaving this page.")
});