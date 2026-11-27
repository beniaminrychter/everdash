/**
* | output |
* | --- |
* | "Finish or remove the new card in “{title}” before saving." |
*
*/
export const admin_unfinished_card_in_view: ((inputs: Admin_Unfinished_Card_In_ViewInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Unfinished_Card_In_ViewInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Unfinished_Card_In_ViewInputs = { title: NonNullable<unknown> };
