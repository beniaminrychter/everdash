/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Forecast_HintInputs */



/**
* | output |
* | --- |
* | "One entry per hour, or one per day." |
*
* @param {Admin_Inspector_Forecast_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_forecast_hint = /** @type {((inputs?: Admin_Inspector_Forecast_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Forecast_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Jeden wpis na godzinę lub jeden na dzień.")
	return /** @type {LocalizedString} */ ("One entry per hour, or one per day.")
});