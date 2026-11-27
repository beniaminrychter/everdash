/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Editor_More_Actions_ForInputs */



/**
* | output |
* | --- |
* | "More actions for {name}" |
*
* @param {Editor_More_Actions_ForInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const editor_more_actions_for = /** @type {((inputs: Editor_More_Actions_ForInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Editor_More_Actions_ForInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Więcej działań dla ${i?.name}`)
	return /** @type {LocalizedString} */ (`More actions for ${i?.name}`)
});