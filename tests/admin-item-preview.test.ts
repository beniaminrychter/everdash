import assert from 'node:assert/strict';
import test from 'node:test';
import type { BadgeConfig, DashboardDocument } from '@everdash/contracts/config/types';
import { draftReducer, initialDraft } from '../apps/admin/src/app/draft/draftReducer';
import { itemPreviewDocument } from '../apps/admin/src/features/editor/itemPreviewDocument';

const fixture: DashboardDocument = {
  schemaVersion: 1,
  polling: { controlsMs: 2000, observationsMs: 30000, metadataMs: 60000 },
  views: [
    {
      id: 'home',
      title: 'Home',
      cards: [
        { type: 'light', entity: 'light.hall' },
        { type: 'outlet', entity: 'switch.lamp' },
      ],
      badges: [{ type: 'temperature', entity: 'sensor.outside' }],
      sections: [
        { id: 'rooms', title: 'Rooms', cards: [{ type: 'light', entity: 'light.bed' }] },
        { id: 'other', title: 'Other', cards: [{ type: 'light', entity: 'light.lab' }] },
      ],
    },
    { id: 'office', title: 'Office', cards: [], badges: [] },
  ],
};

const view = (document: DashboardDocument | null) => document!.views[0]!;

test('a card selection keeps only that card', () => {
  const result = itemPreviewDocument(fixture, 'home', { kind: 'card', index: 1 });

  assert.equal(result?.views.length, 1);
  assert.deepEqual(view(result).cards, [{ type: 'outlet', entity: 'switch.lamp' }]);
  assert.equal(view(result).sections, undefined);
  assert.equal(view(result).badges, undefined);
});

test('a card inside a section keeps only that card', () => {
  const result = itemPreviewDocument(fixture, 'home', {
    kind: 'card',
    section: 'rooms',
    index: 0,
  });

  assert.deepEqual(view(result).cards, [{ type: 'light', entity: 'light.bed' }]);
  assert.equal(view(result).sections, undefined);
});

test('a card that is still being added is drawn with a placeholder entity and a name', () => {
  const started = draftReducer(initialDraft(structuredClone(fixture)), {
    type: 'start-card',
    kind: 'climate',
  });
  const result = itemPreviewDocument(started.document, 'home', started.selection);
  const card = view(result).cards![0] as { entity: string; name?: string; incomplete?: true };

  assert.match(card.entity, /^climate\.select_entity$/);
  assert.equal(card.name, 'New climate');
  assert.equal(card.incomplete, undefined);
});

test('a saved card whose entity is not chosen yet is drawn as a new card', () => {
  const converted: DashboardDocument = {
    ...fixture,
    views: [
      {
        id: 'home',
        title: 'Home',
        cards: [
          { type: 'climate', entity: '' } as unknown as NonNullable<
            DashboardDocument['views'][0]['cards']
          >[0],
        ],
      },
    ],
  };
  const result = itemPreviewDocument(converted, 'home', { kind: 'card', index: 0 });
  const card = view(result).cards![0] as { entity: string; name?: string };

  assert.equal(card.entity, 'climate.select_entity');
  assert.equal(card.name, 'New climate');
});

test('a badge selection keeps only that badge and no cards', () => {
  const result = itemPreviewDocument(fixture, 'home', { kind: 'badge', index: 0 });

  assert.deepEqual(view(result).badges, [{ type: 'temperature', entity: 'sensor.outside' }]);
  assert.equal(view(result).cards, undefined);
  assert.equal(view(result).sections, undefined);
});

test('a pending badge is previewed with a placeholder sensor', () => {
  const badge = { type: 'temperature', entity: '' } as unknown as BadgeConfig;
  const result = itemPreviewDocument(fixture, 'home', { kind: 'pending-badge', badge });

  assert.equal(view(result).badges?.length, 1);
  assert.equal(view(result).badges?.[0]?.entity, 'sensor.select_entity');
  assert.equal(view(result).badges?.[0]?.name, 'New badge');
});

test('a section selection keeps that section and its cards only', () => {
  const result = itemPreviewDocument(fixture, 'home', { kind: 'section', id: 'rooms' });

  assert.deepEqual(
    view(result).sections?.map((section) => section.id),
    ['rooms'],
  );
  assert.deepEqual(view(result).sections?.[0]?.cards, [{ type: 'light', entity: 'light.bed' }]);
  assert.equal(view(result).cards, undefined);
  assert.equal(view(result).badges, undefined);
});

test('the view selection and unknown items have no preview', () => {
  assert.equal(itemPreviewDocument(fixture, 'home', { kind: 'view' }), null);
  assert.equal(itemPreviewDocument(fixture, 'home', { kind: 'card', index: 9 }), null);
  assert.equal(itemPreviewDocument(fixture, 'home', { kind: 'section', id: 'gone' }), null);
  assert.equal(itemPreviewDocument(fixture, 'missing', { kind: 'card', index: 0 }), null);
});
