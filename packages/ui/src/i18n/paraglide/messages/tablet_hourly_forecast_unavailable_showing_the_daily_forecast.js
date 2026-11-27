/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Hourly_Forecast_Unavailable_Showing_The_Daily_ForecastInputs */



/**
* | output |
* | --- |
* | "Hourly forecast unavailable. Showing the daily forecast." |
*
* @param {Tablet_Hourly_Forecast_Unavailable_Showing_The_Daily_ForecastInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_hourly_forecast_unavailable_showing_the_daily_forecast = /** @type {((inputs?: Tablet_Hourly_Forecast_Unavailable_Showing_The_Daily_ForecastInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Hourly_Forecast_Unavailable_Showing_The_Daily_ForecastInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prognoza godzinowa niedostępna. Pokazano prognozę dzienną.")
	return /** @type {LocalizedString} */ ("Hourly forecast unavailable. Showing the daily forecast.")
});