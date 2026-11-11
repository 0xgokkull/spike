import { getAccessToken, paypalFetch, saveFixture } from './common.ts';

async function main() {
  console.log('--- Step B: OAuth token and authenticated read ---');
  console.log('1. Fetching OAuth token...');
  const { token, scope, app_id } = await getAccessToken();
  console.log('OAuth token received successfully.');
  console.log('App ID:', app_id);
  console.log('Scopes granted:');
  scope.split(' ').forEach((s) => console.log('  -', s));

  saveFixture('spike-b-token.json', { app_id, scopes: scope.split(' ') });

  console.log('\n2. Performing authenticated read on /v1/customer/disputes...');
  const res = await paypalFetch('/v1/customer/disputes');
  console.log(`Response status: ${res.status}`);

  if (res.status === 200) {
    console.log('Authenticated read successful!');
    console.log(`Disputes count: ${res.data.items?.length ?? 0}`);
    saveFixture('spike-b-disputes-read.json', res.data);
  } else {
    console.error('Authenticated read returned status:', res.status, res.data);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Step B failed:', err.message);
  process.exit(1);
});

