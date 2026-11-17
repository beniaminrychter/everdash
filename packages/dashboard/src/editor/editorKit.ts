import type { EditorKit } from '../features/dashboard/data/editorKit';
import { AddCardButton } from './components/AddCardButton/AddCardButton';
import { BadgeList } from './components/BadgeList/BadgeList';
import { CardList } from './components/CardList/CardList';
import { EditorBadge } from './components/EditorBadge/EditorBadge';
import { EditorCard } from './components/EditorCard/EditorCard';
import { SectionHeading } from './components/SectionHeading/SectionHeading';
import { SectionList } from './components/SectionList/SectionList';

/**
 * The editor's chrome and drag and drop (SortableJS). Only mountDashboardCanvas imports this, so
 * none of it is bundled into the tablet.
 */
export const editorKit: EditorKit = {
  AddCardButton,
  Badge: EditorBadge,
  BadgeList,
  Card: EditorCard,
  CardList,
  SectionHeading,
  SectionList,
};
