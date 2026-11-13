import { useDraft } from '@/app/DraftContext';
import { draftIssues } from '@/app/draft/draftReducer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EntityCombobox } from '@/features/editor/EntityCombobox';
import { InspectorField } from '@/features/editor/InspectorPanel';
import type { PollingConfig } from '@everdash/contracts/config/types';

const pollingFields: { key: keyof PollingConfig; label: string; hint: string }[] = [
  {
    key: 'controlsMs',
    label: 'Control polling (ms)',
    hint: 'How often tablets refresh lights, outlets and climate controls.',
  },
  {
    key: 'observationsMs',
    label: 'Sensor polling (ms)',
    hint: 'How often tablets refresh sensor badges, weather and energy readings.',
  },
  {
    key: 'metadataMs',
    label: 'Entity metadata polling (ms)',
    hint: 'How often tablets refresh entity names and icons.',
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
      <CardHeader>
        <CardTitle>Dashboard settings</CardTitle>
        <CardDescription>
          These settings apply to every tablet. Changes join the draft and go live when you save.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <InspectorField
          label="Home timezone"
          htmlFor="timezone"
          hint="An IANA timezone such as Europe/Warsaw, used for the clock and sun times."
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
          label="Sun entity"
          htmlFor="sun-entity"
          hint="Optional. Lets the dashboard follow sunrise and sunset."
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
            label={field.label}
            htmlFor={`poll-${field.key}`}
            hint={field.hint}
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
