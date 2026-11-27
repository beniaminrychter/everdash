/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Entity_Not_Found_In_Home_AssistantInputs */



/**
* | output |
* | --- |
* | "Entity not found in Home Assistant." |
*
* @param {Tablet_Entity_Not_Found_In_Home_AssistantInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_entity_not_found_in_home_assistant = /** @type {((inputs?: Tablet_Entity_Not_Found_In_Home_AssistantInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Entity_Not_Found_In_Home_AssistantInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie znaleziono encji w Home Assistant.")
	return /** @type {LocalizedString} */ ("Entity not found in Home Assistant.")
});