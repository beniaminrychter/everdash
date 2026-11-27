/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Dashboard_Json_Is_ValidInputs */



/**
* | output |
* | --- |
* | "Dashboard JSON is valid." |
*
* @param {Tablet_Dashboard_Json_Is_ValidInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_dashboard_json_is_valid = /** @type {((inputs?: Tablet_Dashboard_Json_Is_ValidInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Dashboard_Json_Is_ValidInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("JSON pulpitu jest prawidłowy.")
	return /** @type {LocalizedString} */ ("Dashboard JSON is valid.")
});