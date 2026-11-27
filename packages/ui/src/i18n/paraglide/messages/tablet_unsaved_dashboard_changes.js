/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Unsaved_Dashboard_ChangesInputs */



/**
* | output |
* | --- |
* | "Unsaved dashboard changes." |
*
* @param {Tablet_Unsaved_Dashboard_ChangesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_unsaved_dashboard_changes = /** @type {((inputs?: Tablet_Unsaved_Dashboard_ChangesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Unsaved_Dashboard_ChangesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Niezapisane zmiany pulpitu.")
	return /** @type {LocalizedString} */ ("Unsaved dashboard changes.")
});