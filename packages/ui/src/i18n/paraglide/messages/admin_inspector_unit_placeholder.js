/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Unit_PlaceholderInputs */



/**
* | output |
* | --- |
* | "Use Home Assistant unit" |
*
* @param {Admin_Inspector_Unit_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_unit_placeholder = /** @type {((inputs?: Admin_Inspector_Unit_PlaceholderInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Unit_PlaceholderInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Użyj jednostki z Home Assistant")
	return /** @type {LocalizedString} */ ("Use Home Assistant unit")
});