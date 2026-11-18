import assert from 'node:assert/strict';
import test from 'node:test';
import { beaconToken, publicPageLoad } from './public-traffic';

const home = 'https://phenoshop.app';
const basic = { eventType: 1, siteToken: beaconToken, pageloadId: 'page-1', startTime: 120, nt: 1 };

test('only exact public paths can report and the report contains no form or URL details', () => {
  const raw = JSON.stringify({
    ...basic, location: home + '/?ref=private#fragment', referrer: home + '/invoice/private-link',
    formValue: 'private', serverTimings: [{ location: '/account/profile' }], lcp: { url: '/orders/private' },
  });
  const result = JSON.parse(publicPageLoad(raw, home + '/')!);
  assert.ok(result.location === home + '/');
  assert.ok(result.referrer === home);
  assert.ok(result.siteToken === beaconToken);
  assert.ok(!JSON.stringify(result).includes('private'));
  assert.ok(!('lcp' in result));
  for (const url of [home + '/invoice/abc', home + '/sign-in', home + '/checkout', home + '/account', home + '/other', 'https://example.com/']) {
    assert.ok(publicPageLoad(raw, url) === null);
    assert.ok(publicPageLoad(JSON.stringify({ ...basic, location: url }), home + '/') === null);
  }
  assert.ok(publicPageLoad(JSON.stringify({ ...basic, eventType: 3, location: home + '/' }), home + '/') === null);
  assert.ok(publicPageLoad(JSON.stringify({ ...basic, siteToken: 'other', location: home + '/' }), home + '/') === null);
});
