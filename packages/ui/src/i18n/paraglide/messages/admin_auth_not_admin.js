/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Auth_Not_AdminInputs */



/**
* | output |
* | --- |
* | "That Home Assistant user is not an administrator. Sign in with an administrator account." |
*
* @param {Admin_Auth_Not_AdminInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_auth_not_admin = /** @type {((inputs?: Admin_Auth_Not_AdminInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Auth_Not_AdminInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ten użytkownik Home Assistant nie jest administratorem. Zaloguj się na konto administratora.")
	return /** @type {LocalizedString} */ ("That Home Assistant user is not an administrator. Sign in with an administrator account.")
});