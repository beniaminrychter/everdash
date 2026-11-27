/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Temperature_UnitInputs */



/**
* | output |
* | --- |
* | "Temperature unit" |
*
* @param {Admin_Inspector_Temperature_UnitInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_temperature_unit = /** @type {((inputs?: Admin_Inspector_Temperature_UnitInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Temperature_UnitInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Jednostka temperatury")
	return /** @type {LocalizedString} */ ("Temperature unit")
});