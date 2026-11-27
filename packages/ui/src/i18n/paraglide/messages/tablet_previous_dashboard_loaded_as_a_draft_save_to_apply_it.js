/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Previous_Dashboard_Loaded_As_A_Draft_Save_To_Apply_ItInputs */



/**
* | output |
* | --- |
* | "Previous dashboard loaded as a draft. Save to apply it." |
*
* @param {Tablet_Previous_Dashboard_Loaded_As_A_Draft_Save_To_Apply_ItInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_previous_dashboard_loaded_as_a_draft_save_to_apply_it = /** @type {((inputs?: Tablet_Previous_Dashboard_Loaded_As_A_Draft_Save_To_Apply_ItInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Previous_Dashboard_Loaded_As_A_Draft_Save_To_Apply_ItInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wczytano poprzedni pulpit jako wersję roboczą. Zapisz, aby go zastosować.")
	return /** @type {LocalizedString} */ ("Previous dashboard loaded as a draft. Save to apply it.")
});