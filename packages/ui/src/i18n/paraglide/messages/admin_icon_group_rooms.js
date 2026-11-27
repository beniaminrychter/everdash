/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Admin_Icon_Group_RoomsInputs */



/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Admin_Icon_Group_RoomsInputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const admin_icon_group_rooms = /** @type {((inputs?: Admin_Icon_Group_RoomsInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Admin_Icon_Group_RoomsInputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Pomieszczenia")
	return /** @type {LocalizedString} */ ("Rooms")
});