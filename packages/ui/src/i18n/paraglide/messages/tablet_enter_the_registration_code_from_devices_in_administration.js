/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Enter_The_Registration_Code_From_Devices_In_AdministrationInputs */



/**
* | output |
* | --- |
* | "Enter the registration code from Devices in administration." |
*
* @param {Tablet_Enter_The_Registration_Code_From_Devices_In_AdministrationInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_enter_the_registration_code_from_devices_in_administration = /** @type {((inputs?: Tablet_Enter_The_Registration_Code_From_Devices_In_AdministrationInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Enter_The_Registration_Code_From_Devices_In_AdministrationInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Wpisz kod rejestracji z sekcji Urządzenia w panelu administracyjnym.")
	return /** @type {LocalizedString} */ ("Enter the registration code from Devices in administration.")
});