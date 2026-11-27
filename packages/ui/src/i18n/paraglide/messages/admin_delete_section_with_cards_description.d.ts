/**
* | output |
* | --- |
* | "“{title}” has {cards}. Delete them with the section, or keep them in the view outside any section. Discard restores everything until you save." |
*
*/
export const admin_delete_section_with_cards_description: ((inputs: Admin_Delete_Section_With_Cards_DescriptionInputs, options?: { locale?: "en" | "pl" }) => LocalizedString) & import("../runtime.js").MessageMetadata<Admin_Delete_Section_With_Cards_DescriptionInputs, { locale?: "en" | "pl" }, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Admin_Delete_Section_With_Cards_DescriptionInputs = { title: NonNullable<unknown>, cards: NonNullable<unknown> };
