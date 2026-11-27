/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Enter_The_Code_Shown_On_The_Tablet_Choose_A_Label_Then_ApproInputs */



/**
* | output |
* | --- |
* | "Enter the code shown on the tablet, choose a label, then approve it." |
*
* @param {Tablet_Enter_The_Code_Shown_On_The_Tablet_Choose_A_Label_Then_ApproInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_enter_the_code_shown_on_the_tablet_choose_a_label_then_appro = /** @type {((inputs?: Tablet_Enter_The_Code_Shown_On_The_Tablet_Choose_A_Label_Then_ApproInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Enter_The_Code_Shown_On_The_Tablet_Choose_A_Label_Then_ApproInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wpisz kod wyświetlony na tablecie, wybierz nazwę i zatwierdź parowanie.")
	return /** @type {LocalizedString} */ ("Enter the code shown on the tablet, choose a label, then approve it.")
});