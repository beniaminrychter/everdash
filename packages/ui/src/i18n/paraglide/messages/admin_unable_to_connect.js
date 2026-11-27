/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Unable_To_ConnectInputs */



/**
* | output |
* | --- |
* | "Unable to connect to EverDash." |
*
* @param {Admin_Unable_To_ConnectInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_unable_to_connect = /** @type {((inputs?: Admin_Unable_To_ConnectInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Unable_To_ConnectInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie można połączyć się z EverDash.")
	return /** @type {LocalizedString} */ ("Unable to connect to EverDash.")
});