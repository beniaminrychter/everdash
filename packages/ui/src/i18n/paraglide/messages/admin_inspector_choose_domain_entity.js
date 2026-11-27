/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ domains: NonNullable<unknown> }} Admin_Inspector_Choose_Domain_EntityInputs */



/**
* | output |
* | --- |
* | "Choose a {domains} entity." |
*
* @param {Admin_Inspector_Choose_Domain_EntityInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_inspector_choose_domain_entity = /** @type {((inputs: Admin_Inspector_Choose_Domain_EntityInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Inspector_Choose_Domain_EntityInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Wybierz encję typu ${i?.domains}.`)
	return /** @type {LocalizedString} */ (`Choose a ${i?.domains} entity.`)
});