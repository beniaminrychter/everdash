/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Invalid_Sensor_ResponseInputs */



/**
* | output |
* | --- |
* | "Invalid sensor response." |
*
* @param {Tablet_Invalid_Sensor_ResponseInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_invalid_sensor_response = /** @type {((inputs?: Tablet_Invalid_Sensor_ResponseInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Invalid_Sensor_ResponseInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nieprawidłowa odpowiedź czujnika.")
	return /** @type {LocalizedString} */ ("Invalid sensor response.")
});