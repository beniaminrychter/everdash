/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Adding_To_Your_Home_Screen_And_Offline_Launch_Need_A_Secure_Inputs */



/**
* | output |
* | --- |
* | "Adding to your Home Screen and offline launch need a secure HTTPS connection. Live states and controls always require a connection to Home Assistant." |
*
* @param {Tablet_Adding_To_Your_Home_Screen_And_Offline_Launch_Need_A_Secure_Inputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_adding_to_your_home_screen_and_offline_launch_need_a_secure_ = /** @type {((inputs?: Tablet_Adding_To_Your_Home_Screen_And_Offline_Launch_Need_A_Secure_Inputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Adding_To_Your_Home_Screen_And_Offline_Launch_Need_A_Secure_Inputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Dodanie do ekranu początkowego i uruchamianie bez sieci wymagają bezpiecznego połączenia HTTPS. Aktualne dane i sterowanie wymagają połączenia z Home Assistant.")
	return /** @type {LocalizedString} */ ("Adding to your Home Screen and offline launch need a secure HTTPS connection. Live states and controls always require a connection to Home Assistant.")
});