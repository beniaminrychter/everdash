/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Entity_Not_FoundInputs */



/**
* | output |
* | --- |
* | "Entity not found" |
*
* @param {Tablet_Entity_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_entity_not_found = /** @type {((inputs?: Tablet_Entity_Not_FoundInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Entity_Not_FoundInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie znaleziono encji")
	return /** @type {LocalizedString} */ ("Entity not found")
});