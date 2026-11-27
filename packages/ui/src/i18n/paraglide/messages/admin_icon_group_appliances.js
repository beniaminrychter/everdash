/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Icon_Group_AppliancesInputs */



/**
* | output |
* | --- |
* | "Appliances" |
*
* @param {Admin_Icon_Group_AppliancesInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_group_appliances = /** @type {((inputs?: Admin_Icon_Group_AppliancesInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_Group_AppliancesInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("AGD")
	return /** @type {LocalizedString} */ ("Appliances")
});