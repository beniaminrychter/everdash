/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Tablet_Name_Set_TemperatureInputs */



/**
* | output |
* | --- |
* | "{name} set temperature" |
*
* @param {Tablet_Name_Set_TemperatureInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_name_set_temperature = /** @type {((inputs: Tablet_Name_Set_TemperatureInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Name_Set_TemperatureInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.name}, zadana temperatura`)
	return /** @type {LocalizedString} */ (`${i?.name} set temperature`)
});