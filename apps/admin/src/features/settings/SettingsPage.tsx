import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { useDraft } from '@/app/DraftContext';
import { draftIssues } from '@/app/draft/draftReducer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EntityCombobox } from '@/features/editor/EntityCombobox';
import { InspectorField } from '@/features/editor/InspectorPanel';
import type { PollingConfig } from '@everdash/contracts/config/types';

const pollingFields: { key: keyof PollingConfig; label: () => string; hint: () => string }[] = [
  {
    key: 'controlsMs',
    label: () => m.admin_settings_polling_controls_label(),
    hint: () => m.admin_settings_polling_controls_hint(),
  },
  {
    key: 'observationsMs',
    label: () => m.admin_settings_polling_observations_label(),
    hint: () => m.admin_settings_polling_observations_hint(),
  },
  {
    key: 'metadataMs',
    label: () => m.admin_settings_polling_metadata_label(),
    hint: () => m.admin_settings_polling_metadata_hint(),
  },
];

function issueFor(issues: string[], path: string): string | undefined {
  const prefix = `${path}: `;
  const match = issues.find((issue) => issue.startsWith(prefix));

  return match?.slice(prefix.length);
}

export function SettingsPage() {
  const { state, dispatch } = useDraft();
  const { document } = state;
  const issues = draftIssues(state);

  return (
    <Card>
      <CardContent className="space-y-5">
        <InspectorField
          label={m.admin_settings_timezone_label()}
          htmlFor="timezone"
          hint={m.admin_settings_timezone_hint()}
          error={issueFor(issues, 'timeZone')}
        >
          <Input
            id="timezone"
            placeholder="Europe/Warsaw"
            value={document.timeZone ?? ''}
            onChange={(event) =>
              dispatch({ type: 'update-home', home: { timeZone: event.target.value || undefined } })
            }
          />
        </InspectorField>
        <InspectorField
          label={m.admin_settings_sun_label()}
          htmlFor="sun-entity"
          hint={m.admin_settings_sun_hint()}
          error={issueFor(issues, 'sun')}
        >
          <EntityCombobox
            id="sun-entity"
            value={document.sun ?? ''}
            domain="sun"
            clearable
            onChange={(entity) =>
              dispatch({
                type: 'update-home',
                home: { sun: entity ? (entity as `sun.${string}`) : undefined },
              })
            }
          />
        </InspectorField>
        {pollingFields.map((field) => (
          <InspectorField
            key={field.key}
            label={field.label()}
            htmlFor={`poll-${field.key}`}
            hint={field.hint()}
            error={issueFor(issues, `polling.${field.key}`)}
          >
            <Input
              id={`poll-${field.key}`}
              type="number"
              min={1000}
              value={document.polling?.[field.key] ?? ''}
              onChange={(event) =>
                dispatch({
                  type: 'update-home',
                  home: {
                    polling: {
                      [field.key]: event.target.value ? Number(event.target.value) : undefined,
                    },
                  },
                })
              }
            />
          </InspectorField>
        ))}
      </CardContent>
    </Card>
  );
}
