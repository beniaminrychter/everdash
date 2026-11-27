/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ state: NonNullable<unknown> }} Admin_Entity_Now_StateInputs */



/**
* | output |
* | --- |
* | "Now {state}" |
*
* @param {Admin_Entity_Now_StateInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_entity_now_state = /** @type {((inputs: Admin_Entity_Now_StateInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Entity_Now_StateInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Teraz: ${i?.state}`)
	return /** @type {LocalizedString} */ (`Now ${i?.state}`)
});