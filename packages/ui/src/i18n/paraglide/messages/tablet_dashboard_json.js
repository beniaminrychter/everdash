/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Dashboard_JsonInputs */



/**
* | output |
* | --- |
* | "Dashboard JSON" |
*
* @param {Tablet_Dashboard_JsonInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_dashboard_json = /** @type {((inputs?: Tablet_Dashboard_JsonInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Dashboard_JsonInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("JSON pulpitu")
	return /** @type {LocalizedString} */ ("Dashboard JSON")
});