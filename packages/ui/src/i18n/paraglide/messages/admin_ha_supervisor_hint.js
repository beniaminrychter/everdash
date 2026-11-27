/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Ha_Supervisor_HintInputs */



/**
* | output |
* | --- |
* | "Managed automatically while running inside Home Assistant. No separate login or OAuth token is required." |
*
* @param {Admin_Ha_Supervisor_HintInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_ha_supervisor_hint = /** @type {((inputs?: Admin_Ha_Supervisor_HintInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Ha_Supervisor_HintInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zarządzane automatycznie podczas działania wewnątrz Home Assistant. Oddzielne logowanie ani token OAuth nie są wymagane.")
	return /** @type {LocalizedString} */ ("Managed automatically while running inside Home Assistant. No separate login or OAuth token is required.")
});