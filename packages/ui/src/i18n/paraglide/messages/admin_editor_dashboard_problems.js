/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Editor_Dashboard_ProblemsInputs */



/**
* | output |
* | --- |
* | "This dashboard has problems" |
*
* @param {Admin_Editor_Dashboard_ProblemsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_editor_dashboard_problems = /** @type {((inputs?: Admin_Editor_Dashboard_ProblemsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Editor_Dashboard_ProblemsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ten pulpit zawiera błędy")
	return /** @type {LocalizedString} */ ("This dashboard has problems")
});