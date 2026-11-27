/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Room_TemperaturesInputs */



/**
* | output |
* | --- |
* | "Room temperatures" |
*
* @param {Tablet_Room_TemperaturesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_room_temperatures = /** @type {((inputs?: Tablet_Room_TemperaturesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Room_TemperaturesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Temperatury w pokojach")
	return /** @type {LocalizedString} */ ("Room temperatures")
});