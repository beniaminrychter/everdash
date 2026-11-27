/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_A_Price_Chart_Appears_When_Your_Sensor_Publishes_A_TimestampInputs */



/**
* | output |
* | --- |
* | "A price chart appears when your sensor publishes a timestamped schedule." |
*
* @param {Tablet_A_Price_Chart_Appears_When_Your_Sensor_Publishes_A_TimestampInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_a_price_chart_appears_when_your_sensor_publishes_a_timestamp = /** @type {((inputs?: Tablet_A_Price_Chart_Appears_When_Your_Sensor_Publishes_A_TimestampInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_A_Price_Chart_Appears_When_Your_Sensor_Publishes_A_TimestampInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wykres pojawi się, gdy czujnik udostępni harmonogram cen z datami.")
	return /** @type {LocalizedString} */ ("A price chart appears when your sensor publishes a timestamped schedule.")
});