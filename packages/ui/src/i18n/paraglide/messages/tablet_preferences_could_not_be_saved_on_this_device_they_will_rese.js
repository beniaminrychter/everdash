/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Preferences_Could_Not_Be_Saved_On_This_Device_They_Will_ReseInputs */



/**
* | output |
* | --- |
* | "Preferences could not be saved on this device. They will reset after reopening." |
*
* @param {Tablet_Preferences_Could_Not_Be_Saved_On_This_Device_They_Will_ReseInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_preferences_could_not_be_saved_on_this_device_they_will_rese = /** @type {((inputs?: Tablet_Preferences_Could_Not_Be_Saved_On_This_Device_They_Will_ReseInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Preferences_Could_Not_Be_Saved_On_This_Device_They_Will_ReseInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Nie udało się zapisać ustawień na tym urządzeniu. Po ponownym otwarciu zostaną zresetowane.")
	return /** @type {LocalizedString} */ ("Preferences could not be saved on this device. They will reset after reopening.")
});