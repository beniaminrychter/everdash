/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Approved_The_Tablet_Will_Appear_After_It_Redeems_The_CodeInputs */



/**
* | output |
* | --- |
* | "Approved. The tablet will appear after it redeems the code." |
*
* @param {Tablet_Approved_The_Tablet_Will_Appear_After_It_Redeems_The_CodeInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_approved_the_tablet_will_appear_after_it_redeems_the_code = /** @type {((inputs?: Tablet_Approved_The_Tablet_Will_Appear_After_It_Redeems_The_CodeInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Approved_The_Tablet_Will_Appear_After_It_Redeems_The_CodeInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zatwierdzono. Tablet pojawi się na liście po odebraniu zatwierdzenia.")
	return /** @type {LocalizedString} */ ("Approved. The tablet will appear after it redeems the code.")
});