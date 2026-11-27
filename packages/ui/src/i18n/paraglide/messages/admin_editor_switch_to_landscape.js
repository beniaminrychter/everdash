/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Switch_To_LandscapeInputs */



/**
* | output |
* | --- |
* | "Switch to landscape mode" |
*
* @param {Admin_Editor_Switch_To_LandscapeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_switch_to_landscape = /** @type {((inputs?: Admin_Editor_Switch_To_LandscapeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Switch_To_LandscapeInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przełącz na orientację poziomą")
	return /** @type {LocalizedString} */ ("Switch to landscape mode")
});