/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Dashboard_Saved_And_AppliedInputs */



/**
* | output |
* | --- |
* | "Dashboard saved and applied." |
*
* @param {Tablet_Dashboard_Saved_And_AppliedInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_dashboard_saved_and_applied = /** @type {((inputs?: Tablet_Dashboard_Saved_And_AppliedInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Dashboard_Saved_And_AppliedInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zapisano i zastosowano pulpit.")
	return /** @type {LocalizedString} */ ("Dashboard saved and applied.")
});