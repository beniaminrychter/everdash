import type { ComponentChildren, ComponentType, JSX } from 'preact';
import type { EditorHandler } from './editorEvent';

/*
 * The editor's chrome, handed to DashboardCards by the editor. The tablet never passes a kit, so
 * nothing the kit imports (SortableJS, menus, selection outlines) is part of the tablet bundle.
 * Only types live here.
 */

export interface SectionChoice {
  id: string;
  title: string;
}

export interface CardListProps {
  /** The area's section id, or null for the cards outside any section. */
  section: string | null;
  class: string;
  /** No cards: the list stays a visible drop zone. */
  empty: boolean;
  emptyLabel: string;
  onEvent: EditorHandler;
  children?: ComponentChildren;
}

export interface EditorCardProps {
  section: string | null;
  index: number;
  count: number;
  name: string;
  /** The card's type, which the chrome uses for its hints. */
  type: string;
  selected: boolean;
  /** A new card that still needs an entity; it is outlined as such and cannot be duplicated. */
  incomplete: boolean;
  /** The sections of the view, for "Move to section". */
  sections: readonly SectionChoice[];
  class?: string;
  style?: JSX.CSSProperties;
  dataset?: Readonly<Record<string, string | undefined>>;
  onEvent: EditorHandler;
  children?: ComponentChildren;
}

export interface SectionListProps {
  class: string;
  onEvent: EditorHandler;
  children?: ComponentChildren;
}

export interface SectionHeadingProps {
  id: string;
  headingId: string;
  /** The tablet's heading style, so the editor shows the section as the tablet does. */
  headingClass: string;
  title: string;
  selected: boolean;
  position: number;
  count: number;
  onEvent: EditorHandler;
}

export interface AddCardButtonProps {
  label: string;
  section: string | null;
  onEvent: EditorHandler;
}

export interface BadgeListProps {
  class: string;
  onEvent: EditorHandler;
  children?: ComponentChildren;
}

export interface EditorBadgeProps {
  index: number;
  count: number;
  name: string;
  selected: boolean;
  /** The tablet's own class for a badge, so the editor lays a badge out as the tablet does. */
  class?: string;
  onEvent: EditorHandler;
  children?: ComponentChildren;
}

export interface EditorKit {
  CardList: ComponentType<CardListProps>;
  Card: ComponentType<EditorCardProps>;
  SectionList: ComponentType<SectionListProps>;
  SectionHeading: ComponentType<SectionHeadingProps>;
  AddCardButton: ComponentType<AddCardButtonProps>;
  BadgeList: ComponentType<BadgeListProps>;
  Badge: ComponentType<EditorBadgeProps>;
}
