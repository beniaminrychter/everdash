/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Finish_The_Setup_In_Administration_To_Choose_Who_Can_Open_ThInputs */



/**
* | output |
* | --- |
* | "Finish the setup in administration to choose who can open this dashboard." |
*
* @param {Tablet_Finish_The_Setup_In_Administration_To_Choose_Who_Can_Open_ThInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_finish_the_setup_in_administration_to_choose_who_can_open_th = /** @type {((inputs?: Tablet_Finish_The_Setup_In_Administration_To_Choose_Who_Can_Open_ThInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Finish_The_Setup_In_Administration_To_Choose_Who_Can_Open_ThInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dokończ konfigurację w panelu administracyjnym, aby zdecydować, kto może otwierać ten pulpit.")
	return /** @type {LocalizedString} */ ("Finish the setup in administration to choose who can open this dashboard.")
});