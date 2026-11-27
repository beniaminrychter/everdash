/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Switch_To_PortraitInputs */



/**
* | output |
* | --- |
* | "Switch to portrait mode" |
*
* @param {Admin_Editor_Switch_To_PortraitInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_switch_to_portrait = /** @type {((inputs?: Admin_Editor_Switch_To_PortraitInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Switch_To_PortraitInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Przełącz na orientację pionową")
	return /** @type {LocalizedString} */ ("Switch to portrait mode")
});