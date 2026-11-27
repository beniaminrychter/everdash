/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Editor_Hint_Choose_EntityInputs */



/**
* | output |
* | --- |
* | "Choose an entity" |
*
* @param {Editor_Hint_Choose_EntityInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_hint_choose_entity = /** @type {((inputs?: Editor_Hint_Choose_EntityInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_Hint_Choose_EntityInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wybierz encję")
	return /** @type {LocalizedString} */ ("Choose an entity")
});