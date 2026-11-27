/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Hourly_ForecastInputs */



/**
* | output |
* | --- |
* | "Hourly forecast" |
*
* @param {Tablet_Hourly_ForecastInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_hourly_forecast = /** @type {((inputs?: Tablet_Hourly_ForecastInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Hourly_ForecastInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prognoza godzinowa")
	return /** @type {LocalizedString} */ ("Hourly forecast")
});