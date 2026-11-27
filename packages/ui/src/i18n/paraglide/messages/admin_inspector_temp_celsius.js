/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Temp_CelsiusInputs */



/**
* | output |
* | --- |
* | "°C Celsius" |
*
* @param {Admin_Inspector_Temp_CelsiusInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_temp_celsius = /** @type {((inputs?: Admin_Inspector_Temp_CelsiusInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Temp_CelsiusInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("°C (Celsjusz)")
	return /** @type {LocalizedString} */ ("°C Celsius")
});