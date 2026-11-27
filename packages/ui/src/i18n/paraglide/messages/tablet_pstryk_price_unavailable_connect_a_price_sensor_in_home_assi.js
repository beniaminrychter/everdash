/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Pstryk_Price_Unavailable_Connect_A_Price_Sensor_In_Home_AssiInputs */



/**
* | output |
* | --- |
* | "Pstryk price unavailable. Connect a price sensor in Home Assistant." |
*
* @param {Tablet_Pstryk_Price_Unavailable_Connect_A_Price_Sensor_In_Home_AssiInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_pstryk_price_unavailable_connect_a_price_sensor_in_home_assi = /** @type {((inputs?: Tablet_Pstryk_Price_Unavailable_Connect_A_Price_Sensor_In_Home_AssiInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Pstryk_Price_Unavailable_Connect_A_Price_Sensor_In_Home_AssiInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Cena Pstryk jest niedostępna. Sprawdź czujnik ceny w Home Assistant.")
	return /** @type {LocalizedString} */ ("Pstryk price unavailable. Connect a price sensor in Home Assistant.")
});