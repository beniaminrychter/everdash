/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Invalid_Home_Assistant_Entity_CatalogInputs */



/**
* | output |
* | --- |
* | "Invalid Home Assistant entity catalog." |
*
* @param {Tablet_Invalid_Home_Assistant_Entity_CatalogInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_invalid_home_assistant_entity_catalog = /** @type {((inputs?: Tablet_Invalid_Home_Assistant_Entity_CatalogInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Invalid_Home_Assistant_Entity_CatalogInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nieprawidłowy katalog encji Home Assistant.")
	return /** @type {LocalizedString} */ ("Invalid Home Assistant entity catalog.")
});