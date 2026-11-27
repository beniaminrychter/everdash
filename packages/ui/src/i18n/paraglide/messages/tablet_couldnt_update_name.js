/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Tablet_Couldnt_Update_NameInputs */



/**
* | output |
* | --- |
* | "Couldn’t update {name}." |
*
* @param {Tablet_Couldnt_Update_NameInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_couldnt_update_name = /** @type {((inputs: Tablet_Couldnt_Update_NameInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Couldnt_Update_NameInputs, { locale?: "en" | "pl" }, {}>} */ ((i, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ (`Nie udało się zaktualizować ${i?.name}.`)
	return /** @type {LocalizedString} */ (`Couldn’t update ${i?.name}.`)
});