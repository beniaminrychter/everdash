/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Sidebar_Logout_ErrorInputs */



/**
* | output |
* | --- |
* | "Unable to sign out. Check the connection and try again." |
*
* @param {Admin_Sidebar_Logout_ErrorInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_sidebar_logout_error = /** @type {((inputs?: Admin_Sidebar_Logout_ErrorInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Sidebar_Logout_ErrorInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się wylogować. Sprawdź połączenie i spróbuj ponownie.")
	return /** @type {LocalizedString} */ ("Unable to sign out. Check the connection and try again.")
});