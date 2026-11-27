/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Air_Conditioner_UnavailableInputs */



/**
* | output |
* | --- |
* | "Air conditioner unavailable." |
*
* @param {Tablet_Air_Conditioner_UnavailableInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_air_conditioner_unavailable = /** @type {((inputs?: Tablet_Air_Conditioner_UnavailableInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Air_Conditioner_UnavailableInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Klimatyzator jest niedostępny.")
	return /** @type {LocalizedString} */ ("Air conditioner unavailable.")
});