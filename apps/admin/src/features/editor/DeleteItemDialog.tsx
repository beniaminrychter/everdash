import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useDraft } from '@/app/DraftContext';
import { pluralize } from '@/lib/i18n';

export type DeleteTarget =
  | { kind: 'card'; section?: string | null; index: number }
  | { kind: 'badge'; index: number }
  | { kind: 'section'; id: string };

interface DeleteItemDialogProps {
  target: DeleteTarget | null;
  onClose: () => void;
}

/** Confirms deleting a card, badge or section, whether it was requested from the inspector or canvas. */
export function DeleteItemDialog({ target, onClose }: DeleteItemDialogProps) {
  const { state, dispatch } = useDraft();
  const section =
    target?.kind === 'section'
      ? state.document.views
          .find((view) => view.id === state.viewId)
          ?.sections?.find((item) => item.id === target.id)
      : undefined;
  const cardCount = section?.cards?.length ?? 0;
  const destructive = buttonVariants({ variant: 'destructive' });

  const title =
    target?.kind === 'badge'
      ? m.admin_delete_badge_title()
      : target?.kind === 'section'
        ? m.admin_delete_section_title()
        : m.admin_delete_card_title();

  const description =
    target?.kind === 'section' && cardCount > 0
      ? m.admin_delete_section_with_cards_description({
          title: section?.title ?? '',
          cards: pluralize(cardCount, {
            one: m.admin_count_cards_one,
            few: m.admin_count_cards_few,
            many: m.admin_count_cards_many,
          }),
        })
      : target?.kind === 'badge'
        ? m.admin_delete_badge_description()
        : target?.kind === 'section'
          ? m.admin_delete_section_description()
          : m.admin_delete_card_description();

  const confirmLabel =
    target?.kind === 'section' && cardCount > 0
      ? m.admin_delete_section_and_cards()
      : target?.kind === 'badge'
        ? m.admin_inspector_delete_badge()
        : target?.kind === 'section'
          ? m.admin_inspector_delete_section()
          : m.admin_inspector_delete_card();

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{m.admin_cancel()}</AlertDialogCancel>
          {target?.kind === 'section' && cardCount > 0 && (
            <AlertDialogAction
              className={buttonVariants({ variant: 'outline' })}
              onClick={() => dispatch({ type: 'delete-section', id: target.id, cards: 'keep' })}
            >
              {m.admin_delete_keep_cards()}
            </AlertDialogAction>
          )}
          <AlertDialogAction
            className={destructive}
            onClick={() => {
              if (!target) {
                return;
              }

              if (target.kind === 'section') {
                dispatch({ type: 'delete-section', id: target.id, cards: 'delete' });

                return;
              }

              dispatch(
                target.kind === 'card'
                  ? { type: 'delete-card', section: target.section, index: target.index }
                  : { type: 'delete-badge', index: target.index },
              );
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
