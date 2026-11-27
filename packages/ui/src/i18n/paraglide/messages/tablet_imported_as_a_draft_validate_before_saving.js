/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Imported_As_A_Draft_Validate_Before_SavingInputs */



/**
* | output |
* | --- |
* | "Imported as a draft. Validate before saving." |
*
* @param {Tablet_Imported_As_A_Draft_Validate_Before_SavingInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_imported_as_a_draft_validate_before_saving = /** @type {((inputs?: Tablet_Imported_As_A_Draft_Validate_Before_SavingInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Imported_As_A_Draft_Validate_Before_SavingInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zaimportowano jako wersję roboczą. Sprawdź poprawność przed zapisem.")
	return /** @type {LocalizedString} */ ("Imported as a draft. Validate before saving.")
});