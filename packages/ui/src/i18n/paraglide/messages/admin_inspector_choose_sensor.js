/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Choose_SensorInputs */



/**
* | output |
* | --- |
* | "Choose a sensor entity." |
*
* @param {Admin_Inspector_Choose_SensorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_choose_sensor = /** @type {((inputs?: Admin_Inspector_Choose_SensorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Choose_SensorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wybierz encję typu sensor.")
	return /** @type {LocalizedString} */ ("Choose a sensor entity.")
});