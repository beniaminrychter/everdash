/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Sidebar_Group_DashboardInputs */



/**
* | output |
* | --- |
* | "Dashboard" |
*
* @param {Admin_Sidebar_Group_DashboardInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_sidebar_group_dashboard = /** @type {((inputs?: Admin_Sidebar_Group_DashboardInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Sidebar_Group_DashboardInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pulpit")
	return /** @type {LocalizedString} */ ("Dashboard")
});