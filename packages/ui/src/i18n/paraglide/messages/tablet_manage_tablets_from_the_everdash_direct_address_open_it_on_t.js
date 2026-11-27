/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Manage_Tablets_From_The_Everdash_Direct_Address_Open_It_On_TInputs */



/**
* | output |
* | --- |
* | "Manage tablets from the EverDash direct address. Open it on the tablet and approve its pairing code here." |
*
* @param {Tablet_Manage_Tablets_From_The_Everdash_Direct_Address_Open_It_On_TInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_manage_tablets_from_the_everdash_direct_address_open_it_on_t = /** @type {((inputs?: Tablet_Manage_Tablets_From_The_Everdash_Direct_Address_Open_It_On_TInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Manage_Tablets_From_The_Everdash_Direct_Address_Open_It_On_TInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Zarządzaj tabletami przez bezpośredni adres EverDash. Otwórz go na tablecie i zatwierdź tutaj kod parowania.")
	return /** @type {LocalizedString} */ ("Manage tablets from the EverDash direct address. Open it on the tablet and approve its pairing code here.")
});