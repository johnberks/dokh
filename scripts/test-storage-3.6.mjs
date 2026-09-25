import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

// Exercise the Storage HTTP API, not just storage.objects metadata: deleting a
// row directly would leave the actual object bytes behind.
const status = execFileSync('node_modules/.bin/supabase', ['status', '-o', 'env'], {
  encoding: 'utf8',
  env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
});
const localEnv = Object.fromEntries(
  status
    .trim()
    .split('\n')
    .map((line) => {
      const separator = line.indexOf('=');
      const value = line.slice(separator + 1).trim();
      return [line.slice(0, separator), value.replace(/^"|"$/g, '')];
    }),
);
const apiUrl = localEnv.API_URL;
const anonKey = localEnv.ANON_KEY;
const serviceKey = localEnv.SERVICE_ROLE_KEY;
assert.ok(apiUrl && anonKey && serviceKey, 'Supabase local status must expose API and keys');

const bucketRows = execFileSync(
  'docker',
  [
    'exec',
    'supabase_db_dokh',
    'psql',
    '-U',
    'postgres',
    '-At',
    '-F',
    '|',
    '-c',
    "select id, public, file_size_limit from storage.buckets where id in ('avatars', 'imports') order by id",
  ],
  { encoding: 'utf8' },
)
  .trim()
  .split('\n');
assert.deepEqual(bucketRows, ['avatars|f|10485760', 'imports|f|10485760']);

const objectUrl = (bucket, path) =>
  `/storage/v1/object/${bucket}/${path.split('/').map(encodeURIComponent).join('/')}`;

async function request(
  path,
  { method = 'GET', token = anonKey, body, contentType, headers = {} } = {},
) {
  const response = await fetch(new URL(path, apiUrl), {
    method,
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      ...(contentType ? { 'content-type': contentType } : {}),
      ...headers,
    },
    body,
  });
  return response;
}

async function jsonRequest(path, options) {
  const response = await request(path, {
    ...options,
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    contentType: 'application/json',
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function expectSuccess(response, label) {
  assert.ok(response.ok, `${label}: expected success, got HTTP ${response.status}`);
}

function expectDenied(response, label) {
  assert.ok(!response.ok, `${label}: expected denial, got HTTP ${response.status}`);
}

async function createUser() {
  const email = `storage-test-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const created = await jsonRequest('/auth/v1/admin/users', {
    method: 'POST',
    token: serviceKey,
    body: { email, password, email_confirm: true },
  });
  expectSuccess(created.response, 'create disposable user');
  assert.ok(created.data.id);
  users.push({ id: created.data.id });
  const session = await jsonRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  expectSuccess(session.response, 'sign in disposable user');
  assert.ok(session.data.access_token);
  return { id: created.data.id, token: session.data.access_token };
}

async function removeObject(bucket, path, token) {
  return jsonRequest(`/storage/v1/object/${bucket}`, {
    method: 'DELETE',
    token,
    body: { prefixes: [path] },
  });
}

const users = [];
const objects = [];

try {
  const owner = await createUser();
  const stranger = await createUser();

  for (const fixture of [
    {
      bucket: 'avatars',
      mime: 'image/png',
      bytes: Buffer.from('89504e470d0a1a0a0000000049454e44ae426082', 'hex'),
      extension: 'png',
      badMime: 'text/plain',
    },
    {
      bucket: 'imports',
      mime: 'text/csv',
      bytes: Buffer.from('date,amount\n2026-09-22,100\n'),
      extension: 'csv',
      badMime: 'image/png',
    },
  ]) {
    const path = `${owner.id}/${randomUUID()}.${fixture.extension}`;
    const endpoint = objectUrl(fixture.bucket, path);

    const badType = await request(objectUrl(fixture.bucket, `${owner.id}/${randomUUID()}.bad`), {
      method: 'POST',
      token: owner.token,
      body: fixture.bytes,
      contentType: fixture.badMime,
    });
    expectDenied(badType, `${fixture.bucket}: disallowed MIME`);

    const strangerUpload = await request(endpoint, {
      method: 'POST',
      token: stranger.token,
      body: fixture.bytes,
      contentType: fixture.mime,
    });
    expectDenied(strangerUpload, `${fixture.bucket}: another user's path`);

    const anonUpload = await request(endpoint, {
      method: 'POST',
      body: fixture.bytes,
      contentType: fixture.mime,
    });
    expectDenied(anonUpload, `${fixture.bucket}: anonymous upload`);

    const uploaded = await request(endpoint, {
      method: 'POST',
      token: owner.token,
      body: fixture.bytes,
      contentType: fixture.mime,
    });
    expectSuccess(uploaded, `${fixture.bucket}: owner upload`);
    objects.push({ bucket: fixture.bucket, path });

    const overwrite = await request(endpoint, {
      method: 'POST',
      token: owner.token,
      body: Buffer.from('overwrite'),
      contentType: fixture.mime,
      headers: { 'x-upsert': 'true' },
    });
    expectDenied(overwrite, `${fixture.bucket}: immutable object`);

    const authenticatedPath = `/storage/v1/object/authenticated/${fixture.bucket}/${path}`;
    const ownDownload = await request(authenticatedPath, { token: owner.token });
    expectSuccess(ownDownload, `${fixture.bucket}: owner download`);
    assert.deepEqual(Buffer.from(await ownDownload.arrayBuffer()), fixture.bytes);

    expectDenied(
      await request(authenticatedPath, { token: stranger.token }),
      `${fixture.bucket}: foreign download`,
    );
    expectDenied(await request(authenticatedPath), `${fixture.bucket}: anonymous download`);
    expectDenied(
      await request(`/storage/v1/object/public/${fixture.bucket}/${path}`),
      `${fixture.bucket}: public URL`,
    );

    const foreignSign = await jsonRequest(`/storage/v1/object/sign/${fixture.bucket}/${path}`, {
      method: 'POST',
      token: stranger.token,
      body: { expiresIn: 1 },
    });
    expectDenied(foreignSign.response, `${fixture.bucket}: foreign signed URL`);

    const signed = await jsonRequest(`/storage/v1/object/sign/${fixture.bucket}/${path}`, {
      method: 'POST',
      token: owner.token,
      body: { expiresIn: 1 },
    });
    expectSuccess(signed.response, `${fixture.bucket}: owner signed URL`);
    assert.ok(signed.data.signedURL?.startsWith('/object/sign/'));
    const signedPath = `/storage/v1${signed.data.signedURL}`;
    expectSuccess(await request(signedPath), `${fixture.bucket}: valid signed URL`);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    expectDenied(await request(signedPath), `${fixture.bucket}: expired signed URL`);

    await removeObject(fixture.bucket, path, stranger.token);
    expectSuccess(
      await request(authenticatedPath, { token: owner.token }),
      `${fixture.bucket}: foreign delete must not remove object`,
    );

    const signedBeforeDelete = await jsonRequest(
      `/storage/v1/object/sign/${fixture.bucket}/${path}`,
      {
        method: 'POST',
        token: owner.token,
        body: { expiresIn: 60 },
      },
    );
    expectSuccess(signedBeforeDelete.response, `${fixture.bucket}: signed URL before deletion`);

    const deleted = await removeObject(fixture.bucket, path, owner.token);
    expectSuccess(deleted.response, `${fixture.bucket}: owner delete`);
    expectDenied(
      await request(authenticatedPath, { token: owner.token }),
      `${fixture.bucket}: deleted bytes unavailable`,
    );
    expectDenied(
      await request(`/storage/v1${signedBeforeDelete.data.signedURL}`),
      `${fixture.bucket}: signed URL cannot serve deleted bytes`,
    );
    objects.pop();
    console.log(`${fixture.bucket}: private upload, download, signed expiry and delete passed`);
  }
} finally {
  for (const { bucket, path } of objects) {
    const removed = await removeObject(bucket, path, serviceKey);
    expectSuccess(removed.response, `cleanup ${bucket} object`);
  }
  for (const user of users) {
    const deleted = await request(`/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      token: serviceKey,
    });
    expectSuccess(deleted, 'cleanup disposable user');
  }
}
