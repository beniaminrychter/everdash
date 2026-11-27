/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Json_Enter_JsonInputs */



/**
* | output |
* | --- |
* | "Enter dashboard JSON." |
*
* @param {Admin_Json_Enter_JsonInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_json_enter_json = /** @type {((inputs?: Admin_Json_Enter_JsonInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Json_Enter_JsonInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wpisz JSON pulpitu.")
	return /** @type {LocalizedString} */ ("Enter dashboard JSON.")
});