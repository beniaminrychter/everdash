/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Dashboard_Json_ConfigurationInputs */



/**
* | output |
* | --- |
* | "Dashboard JSON configuration" |
*
* @param {Tablet_Dashboard_Json_ConfigurationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_dashboard_json_configuration = /** @type {((inputs?: Tablet_Dashboard_Json_ConfigurationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Dashboard_Json_ConfigurationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Konfiguracja pulpitu w JSON")
	return /** @type {LocalizedString} */ ("Dashboard JSON configuration")
});