/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Dashboard_ConfigurationInputs */



/**
* | output |
* | --- |
* | "Dashboard configuration" |
*
* @param {Tablet_Dashboard_ConfigurationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_dashboard_configuration = /** @type {((inputs?: Tablet_Dashboard_ConfigurationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Dashboard_ConfigurationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Konfiguracja pulpitu")
	return /** @type {LocalizedString} */ ("Dashboard configuration")
});