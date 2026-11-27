/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Forecast_HourlyInputs */



/**
* | output |
* | --- |
* | "Every hour" |
*
* @param {Admin_Inspector_Forecast_HourlyInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_forecast_hourly = /** @type {((inputs?: Admin_Inspector_Forecast_HourlyInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Forecast_HourlyInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Co godzinę")
	return /** @type {LocalizedString} */ ("Every hour")
});