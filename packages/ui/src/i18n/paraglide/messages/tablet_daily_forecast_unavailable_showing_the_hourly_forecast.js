/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Daily_Forecast_Unavailable_Showing_The_Hourly_ForecastInputs */



/**
* | output |
* | --- |
* | "Daily forecast unavailable. Showing the hourly forecast." |
*
* @param {Tablet_Daily_Forecast_Unavailable_Showing_The_Hourly_ForecastInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_daily_forecast_unavailable_showing_the_hourly_forecast = /** @type {((inputs?: Tablet_Daily_Forecast_Unavailable_Showing_The_Hourly_ForecastInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Daily_Forecast_Unavailable_Showing_The_Hourly_ForecastInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Prognoza dzienna niedostępna. Pokazano prognozę godzinową.")
	return /** @type {LocalizedString} */ ("Daily forecast unavailable. Showing the hourly forecast.")
});