/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Inspector_View_Name_RequiredInputs */



/**
* | output |
* | --- |
* | "Give the view a name." |
*
* @param {Admin_Inspector_View_Name_RequiredInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_view_name_required = /** @type {((inputs?: Admin_Inspector_View_Name_RequiredInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_View_Name_RequiredInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Podaj nazwę widoku.")
	return /** @type {LocalizedString} */ ("Give the view a name.")
});