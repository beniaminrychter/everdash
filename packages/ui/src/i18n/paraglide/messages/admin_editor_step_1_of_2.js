/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Step_1_Of_2Inputs */



/**
* | output |
* | --- |
* | "Step 1 of 2" |
*
* @param {Admin_Editor_Step_1_Of_2Inputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_step_1_of_2 = /** @type {((inputs?: Admin_Editor_Step_1_Of_2Inputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Step_1_Of_2Inputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Krok 1 z 2")
	return /** @type {LocalizedString} */ ("Step 1 of 2")
});