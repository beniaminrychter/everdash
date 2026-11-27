/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Paired_TabletsInputs */



/**
* | output |
* | --- |
* | "Paired tablets" |
*
* @param {Tablet_Paired_TabletsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_paired_tablets = /** @type {((inputs?: Tablet_Paired_TabletsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Paired_TabletsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Sparowane tablety")
	return /** @type {LocalizedString} */ ("Paired tablets")
});