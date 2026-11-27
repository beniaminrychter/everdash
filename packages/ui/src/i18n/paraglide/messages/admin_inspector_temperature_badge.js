/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Temperature_BadgeInputs */



/**
* | output |
* | --- |
* | "Temperature badge" |
*
* @param {Admin_Inspector_Temperature_BadgeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_temperature_badge = /** @type {((inputs?: Admin_Inspector_Temperature_BadgeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Temperature_BadgeInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Plakietka temperatury")
	return /** @type {LocalizedString} */ ("Temperature badge")
});