/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Tablet_This_Tablet_Will_Return_To_The_Registration_Screen_And_Need_Inputs */



/**
* | output |
* | --- |
* | "This tablet will return to the registration screen and need a new code from administration." |
*
* @param {Tablet_This_Tablet_Will_Return_To_The_Registration_Screen_And_Need_Inputs} inputs
* @param {{ locale?: "en" | "pl" }} options
* @returns {LocalizedString}
*/
export const tablet_this_tablet_will_return_to_the_registration_screen_and_need_ = /** @type {((inputs?: Tablet_This_Tablet_Will_Return_To_The_Registration_Screen_And_Need_Inputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Tablet_This_Tablet_Will_Return_To_The_Registration_Screen_And_Need_Inputs, { locale?: "en" | "pl" }, {}>} */ ((inputs = {}, options = {}) => {
	void inputs;
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "pl") return /** @type {LocalizedString} */ ("Ten tablet wróci do ekranu rejestracji i będzie wymagał nowego kodu z panelu administracyjnego.")
	return /** @type {LocalizedString} */ ("This tablet will return to the registration screen and need a new code from administration.")
});