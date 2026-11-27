/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Temp_FahrenheitInputs */



/**
* | output |
* | --- |
* | "°F Fahrenheit" |
*
* @param {Admin_Inspector_Temp_FahrenheitInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_temp_fahrenheit = /** @type {((inputs?: Admin_Inspector_Temp_FahrenheitInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Temp_FahrenheitInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("°F (Fahrenheit)")
	return /** @type {LocalizedString} */ ("°F Fahrenheit")
});