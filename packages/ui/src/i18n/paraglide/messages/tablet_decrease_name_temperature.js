/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Tablet_Decrease_Name_TemperatureInputs */



/**
* | output |
* | --- |
* | "Decrease {name} temperature" |
*
* @param {Tablet_Decrease_Name_TemperatureInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_decrease_name_temperature = /** @type {((inputs: Tablet_Decrease_Name_TemperatureInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Decrease_Name_TemperatureInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Zmniejsz temperaturę: ${i?.name}`)
	return /** @type {LocalizedString} */ (`Decrease ${i?.name} temperature`)
});