/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Disconnect_EllipsisInputs */



/**
* | output |
* | --- |
* | "Disconnect…" |
*
* @param {Admin_Ha_Disconnect_EllipsisInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_disconnect_ellipsis = /** @type {((inputs?: Admin_Ha_Disconnect_EllipsisInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Disconnect_EllipsisInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Rozłącz…")
	return /** @type {LocalizedString} */ ("Disconnect…")
});