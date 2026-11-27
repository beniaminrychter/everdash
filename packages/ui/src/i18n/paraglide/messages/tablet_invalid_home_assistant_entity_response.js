/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Invalid_Home_Assistant_Entity_ResponseInputs */



/**
* | output |
* | --- |
* | "Invalid Home Assistant entity response." |
*
* @param {Tablet_Invalid_Home_Assistant_Entity_ResponseInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_invalid_home_assistant_entity_response = /** @type {((inputs?: Tablet_Invalid_Home_Assistant_Entity_ResponseInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Invalid_Home_Assistant_Entity_ResponseInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nieprawidłowa odpowiedź encji Home Assistant.")
	return /** @type {LocalizedString} */ ("Invalid Home Assistant entity response.")
});