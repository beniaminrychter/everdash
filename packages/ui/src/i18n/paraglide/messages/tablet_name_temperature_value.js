/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, value: NonNullable<unknown> }} Tablet_Name_Temperature_ValueInputs */



/**
* | output |
* | --- |
* | "{name} temperature: {value}" |
*
* @param {Tablet_Name_Temperature_ValueInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_name_temperature_value = /** @type {((inputs: Tablet_Name_Temperature_ValueInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Name_Temperature_ValueInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`${i?.name}, temperatura: ${i?.value}`)
	return /** @type {LocalizedString} */ (`${i?.name} temperature: ${i?.value}`)
});