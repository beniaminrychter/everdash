/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Connect_EllipsisInputs */



/**
* | output |
* | --- |
* | "Connect…" |
*
* @param {Admin_Ha_Connect_EllipsisInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_connect_ellipsis = /** @type {((inputs?: Admin_Ha_Connect_EllipsisInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Connect_EllipsisInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Połącz…")
	return /** @type {LocalizedString} */ ("Connect…")
});