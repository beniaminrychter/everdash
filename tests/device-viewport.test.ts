import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseScreenSize,
  resolveDeviceViewport,
  resolvePreviewScale,
  toDeviceViewportOptions,
} from '../apps/admin/src/features/editor/deviceViewport';
import { detectDeviceType } from '../apps/tablet/src/app/deviceInfo';

test('resolvePreviewScale computes fixed percentages and fit-to-screen scale', () => {
  assert.equal(
    resolvePreviewScale('50', { width: 440, height: 956 }, { width: 800, height: 700 }),
    0.5,
  );
  assert.equal(
    resolvePreviewScale('75', { width: 440, height: 956 }, { width: 800, height: 700 }),
    0.75,
  );
  assert.equal(
    resolvePreviewScale('100', { width: 440, height: 956 }, { width: 800, height: 700 }),
    1,
  );
  assert.equal(
    resolvePreviewScale('fit', { width: 440, height: 956 }, { width: 800, height: 478 }),
    0.5,
  );
  assert.equal(
    resolvePreviewScale('fit', { width: 956, height: 440 }, { width: 478, height: 700 }),
    0.5,
  );
  assert.equal(
    resolvePreviewScale('fit', { width: 390, height: 844 }, { width: 1000, height: 1000 }),
    1,
  );
});

test('parseScreenSize parses valid screen size strings and rejects unknown values', () => {
  assert.deepEqual(parseScreenSize('390 × 844'), { width: 390, height: 844 });
  assert.deepEqual(parseScreenSize('1024x768'), { width: 1024, height: 768 });
  assert.equal(parseScreenSize('Unknown'), null);
  assert.equal(parseScreenSize('0 × 800'), null);
});

test('toDeviceViewportOptions filters unknown sizes and resolves portrait/landscape', () => {
  const options = toDeviceViewportOptions([
    {
      id: 'dev1',
      name: 'Wall iPhone',
      ip: '192.168.1.10',
      deviceType: 'iPhone',
      screenSize: '390 × 844',
      registeredAt: 1,
      lastSeenAt: 1,
    },
    {
      id: 'dev2',
      name: '',
      ip: '192.168.1.11',
      deviceType: 'iPad',
      screenSize: '1024 × 768',
      registeredAt: 2,
      lastSeenAt: 2,
    },
    {
      id: 'dev3',
      name: 'No screen',
      ip: '192.168.1.12',
      deviceType: 'Browser',
      screenSize: 'Unknown',
      registeredAt: 3,
      lastSeenAt: 3,
    },
  ]);

  assert.equal(options.length, 2);
  assert.equal(options[0]!.label, 'Wall iPhone');
  assert.equal(options[0]!.defaultOrientation, 'portrait');
  assert.equal(options[1]!.label, 'iPad');
  assert.equal(options[1]!.defaultOrientation, 'landscape');

  assert.deepEqual(resolveDeviceViewport(options[0]!, 'portrait'), {
    deviceId: 'dev1',
    label: 'Wall iPhone',
    width: 390,
    height: 844,
    orientation: 'portrait',
  });
  assert.deepEqual(resolveDeviceViewport(options[0]!, 'landscape'), {
    deviceId: 'dev1',
    label: 'Wall iPhone',
    width: 844,
    height: 390,
    orientation: 'landscape',
  });
});

test('detectDeviceType classifies iPhone even with multi-touch support', () => {
  const originalNavigator = globalThis.navigator;

  try {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        platform: 'iPhone',
        maxTouchPoints: 5,
      },
    });
    assert.equal(detectDeviceType(), 'iPhone');

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        platform: 'MacIntel',
        maxTouchPoints: 5,
      },
    });
    assert.equal(detectDeviceType(), 'iPad');
  } finally {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
  }
});
