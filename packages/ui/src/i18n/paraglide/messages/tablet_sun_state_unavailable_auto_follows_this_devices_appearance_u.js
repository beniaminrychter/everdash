/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_Sun_State_Unavailable_Auto_Follows_This_Devices_Appearance_UInputs */



/**
* | output |
* | --- |
* | "Sun state unavailable. Auto follows this device’s appearance until it reconnects." |
*
* @param {Tablet_Sun_State_Unavailable_Auto_Follows_This_Devices_Appearance_UInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_sun_state_unavailable_auto_follows_this_devices_appearance_u = /** @type {((inputs?: Tablet_Sun_State_Unavailable_Auto_Follows_This_Devices_Appearance_UInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_Sun_State_Unavailable_Auto_Follows_This_Devices_Appearance_UInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Brak danych o słońcu. Do czasu połączenia wygląd dostosuje się do ustawień urządzenia.")
	return /** @type {LocalizedString} */ ("Sun state unavailable. Auto follows this device’s appearance until it reconnects.")
});