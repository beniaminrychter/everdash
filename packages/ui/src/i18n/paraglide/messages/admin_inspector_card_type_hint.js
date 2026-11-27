/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_Card_Type_HintInputs */



/**
* | output |
* | --- |
* | "The entity is kept if the new type can show it." |
*
* @param {Admin_Inspector_Card_Type_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_card_type_hint = /** @type {((inputs?: Admin_Inspector_Card_Type_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Card_Type_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Encja zostanie zachowana, jeśli nowy typ ją obsługuje.")
	return /** @type {LocalizedString} */ ("The entity is kept if the new type can show it.")
});