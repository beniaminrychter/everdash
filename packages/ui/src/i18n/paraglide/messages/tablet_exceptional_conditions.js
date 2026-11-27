/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Exceptional_ConditionsInputs */



/**
* | output |
* | --- |
* | "Exceptional conditions" |
*
* @param {Tablet_Exceptional_ConditionsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_exceptional_conditions = /** @type {((inputs?: Tablet_Exceptional_ConditionsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Exceptional_ConditionsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nietypowe warunki")
	return /** @type {LocalizedString} */ ("Exceptional conditions")
});