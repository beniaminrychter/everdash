/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Card_Kind_Outlet_DescInputs */



/**
* | output |
* | --- |
* | "Switch a smart plug" |
*
* @param {Admin_Card_Kind_Outlet_DescInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_card_kind_outlet_desc = /** @type {((inputs?: Admin_Card_Kind_Outlet_DescInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Card_Kind_Outlet_DescInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Steruj inteligentnym gniazdkiem")
	return /** @type {LocalizedString} */ ("Switch a smart plug")
});