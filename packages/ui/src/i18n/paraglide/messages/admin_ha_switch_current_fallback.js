/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Switch_Current_FallbackInputs */



/**
* | output |
* | --- |
* | "the current instance" |
*
* @param {Admin_Ha_Switch_Current_FallbackInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_switch_current_fallback = /** @type {((inputs?: Admin_Ha_Switch_Current_FallbackInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Switch_Current_FallbackInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("bieżącą instancją")
	return /** @type {LocalizedString} */ ("the current instance")
});