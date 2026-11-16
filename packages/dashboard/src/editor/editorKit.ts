import type { EditorKit } from '../features/dashboard/data/editorKit';
import { AddCardButton } from './components/AddCardButton/AddCardButton';
import { CardList } from './components/CardList/CardList';
import { EditorCard } from './components/EditorCard/EditorCard';
import { SectionHeading } from './components/SectionHeading/SectionHeading';
import { SectionList } from './components/SectionList/SectionList';

/**
 * The editor's chrome and drag and drop (SortableJS). Only mountDashboardCanvas imports this, so
 * none of it is bundled into the tablet.
 */
export const editorKit: EditorKit = {
  AddCardButton,
  Card: EditorCard,
  CardList,
  SectionHeading,
  SectionList,
};
