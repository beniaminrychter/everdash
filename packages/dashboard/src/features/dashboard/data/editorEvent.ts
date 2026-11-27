/** A card's place: the id of its section, or null for the cards outside any section. */
export interface CardLocation {
  section: string | null;
  index: number;
}

/** What the editor canvas reports. `section` is a section id, or null for the unsectioned cards. */
export type EditorEvent =
  | { type: 'card.edit' | 'card.delete' | 'card.duplicate'; section: string | null; index: number }
  | {
      type: 'card.move';
      section: string | null;
      index: number;
      /** Moves within the same list by this many places. */
      offset?: number;
      /** Moves to this final index of the list named by `toSection` (the card's own list if omitted). */
      to?: number;
      toSection?: string | null;
      /** Moves to the end of the list named by `toSection`. */
      toEnd?: boolean;
    }
  | { type: 'card.add'; section: string | null }
  | { type: 'badge.add' }
  | { type: 'badge.edit' | 'badge.delete' | 'badge.duplicate'; index: number }
  | {
      type: 'badge.move';
      index: number;
      /** Moves by this many places, or to this final index when `to` is given. */
      offset?: number;
      to?: number;
    }
  | { type: 'section.edit' | 'section.rename' | 'section.delete'; section: string }
  | {
      type: 'section.move';
      section: string;
      /** Moves by this many places, or to this final index when `to` is given. */
      offset?: number;
      to?: number;
    };

export type EditorHandler = (event: EditorEvent) => void;

/** What the editor canvas outlines as selected. */
export type EditorSelection =
  | { kind: 'card'; section: string | null; index: number }
  | { kind: 'badge'; index: number }
  | { kind: 'section'; section: string };
