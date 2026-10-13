import { generateKeyPairSync, sign } from 'node:crypto';
import bs58 from 'bs58';
import { SignJWT } from 'jose';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import {
  TREETINO_PROGRAM_ID,
  type ApiHealth,
  type ProtocolInfo,
} from '@treetino/contracts';
import { testDatabase } from './database.fixture';
import { createApplication } from '../dist/application.js';
import { Keypair } from '@solana/web3.js';
import { IndexerService } from '../dist/indexer/indexer.service.js';
import { IndexerConfig } from '../dist/indexer/indexer.config.js';

describe('compiled NestJS application running on Bun', () => {
  let app: Awaited<ReturnType<typeof createApplication>>;
  let baseUrl: string;
  let database: Awaited<ReturnType<typeof testDatabase>>;

  beforeAll(async () => {
    const previousSecret = process.env.AUTH_JWT_SECRET;
    process.env.AUTH_JWT_SECRET = 'test-only-secret-32-bytes-or-longer';
    const previousEnabled = process.env.INDEXER_ENABLED;
    database = await testDatabase();
    const previousPath = process.env.DATABASE_URL;
    process.env.INDEXER_ENABLED = 'false';
    process.env.DATABASE_URL = database.config.url;
    try {
      app = await createApplication({ logger: false });
    } finally {
      if (previousSecret === undefined) delete process.env.AUTH_JWT_SECRET;
      else process.env.AUTH_JWT_SECRET = previousSecret;
      if (previousEnabled === undefined) delete process.env.INDEXER_ENABLED;
      else process.env.INDEXER_ENABLED = previousEnabled;
      if (previousPath === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousPath;
    }
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });
  afterAll(async () => {
    await app.close();
    await database.cleanup();
  });

  test('client wallet login is purpose bound, grants no admin access, and scopes trees and reports before pagination', async () => {
    const keys = generateKeyPairSync('ed25519');
    const wallet = bs58.encode(
      keys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32),
    );
    const post = (path: string, body: unknown) =>
      fetch(baseUrl + '/api/' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const get = (path: string, token?: string) =>
      fetch(baseUrl + '/api/' + path, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    expect((await get('client/me')).status).toBe(401);
    expect((await get('client/trees')).status).toBe(401);
    const challenge = async (role = 'client') => {
      const response = await post(
        role === 'client' ? 'auth/client/challenge' : 'auth/challenge',
        { wallet },
      );
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain(`Treetino ${role} access`);
      return {
        challengeId: data.id,
        wallet,
        signature: bs58.encode(
          sign(null, Buffer.from(data.message), keys.privateKey),
        ),
      };
    };
    const input = await challenge();
    expect((await post('auth/login', input)).status).toBe(401);
    expect(
      (
        await post('auth/client/login', {
          ...input,
          signature: bs58.encode(
            sign(null, Buffer.from('wrong message'), keys.privateKey),
          ),
        })
      ).status,
    ).toBe(401);
    const response = await post('auth/client/login', input);
    expect(response.status).toBe(201);
    const session = await response.json();
    expect(session.client).toEqual({ wallet });
    expect(session).not.toHaveProperty('admin');
    expect((await post('auth/client/login', input)).status).toBe(401);
    expect(await (await get('client/me', session.accessToken)).json()).toEqual({
      wallet,
    });
    expect((await get('admin/me', session.accessToken)).status).toBe(401);
    expect(
      (
        await get(
          `admin/trees/${TREETINO_PROGRAM_ID}/report-simulation`,
          session.accessToken,
        )
      ).status,
    ).toBe(401);
    const adminInput = await challenge('admin');
    expect((await post('auth/client/login', adminInput)).status).toBe(401);
    const [admin] =
      await database.sql`INSERT INTO admins (wallet) VALUES (${wallet}) RETURNING id`;
    const adminSession = await (await post('auth/login', adminInput)).json();
    expect((await get('client/me', adminSession.accessToken)).status).toBe(401);
    expect((await get('admin/me', adminSession.accessToken)).status).toBe(200);
    await database.sql`DELETE FROM admins WHERE id = ${admin.id}`;
    const expired = await challenge();
    await database.sql`UPDATE auth_challenges SET expires_at=0 WHERE id=${expired.challengeId}`;
    expect((await post('auth/client/login', expired)).status).toBe(401);
    const expiredToken = await new SignJWT({ wallet, role: 'client' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(wallet)
      .setIssuer('treetino')
      .setAudience('treetino-client')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode('test-only-secret-32-bytes-or-longer'));
    expect((await get('client/me', expiredToken)).status).toBe(401);

    const stream = `client-scope:${TREETINO_PROGRAM_ID}`;
    const config = app.get(IndexerConfig);
    const indexer = app.get(IndexerService);
    const addresses = Array.from({ length: 3 }, () =>
      Keypair.generate().publicKey.toBase58(),
    ).sort();
    const report = Keypair.generate().publicKey.toBase58();
    await database.sql`INSERT INTO indexer_state (stream,start_time) VALUES (${stream},0)`;
    await database.sql`INSERT INTO indexer_sources (rpc_url,program_id,stream) VALUES (${config.rpcUrl},${TREETINO_PROGRAM_ID},${stream})`;
    for (const [i, address] of addresses.entries())
      await database.sql`INSERT INTO indexed_trees (stream,address,tree_id,creator,supplier,client,reporter,payment_mint,share_mint,funding_token_account,target,raised,phase,signature,block_time) VALUES (${stream},${address},${String(i)},${wallet},${wallet},${i === 0 ? TREETINO_PROGRAM_ID : wallet},${wallet},${TREETINO_PROGRAM_ID},${TREETINO_PROGRAM_ID},${TREETINO_PROGRAM_ID},'1','1','active','init',0)`;
    await database.sql`INSERT INTO indexed_reports (stream,address,tree,day_start_ts,submitted_at,reporter,wh,total_wh,invoice_issued,due,paid,signature,block_time) VALUES (${stream},${report},${addresses[1]},'0','86400',${wallet},'[1,2]'::jsonb,'3',true,'3','0','report',0)`;
    await indexer.onModuleInit();
    try {
      const page = await (
        await get(
          `client/trees?limit=1&wallet=${TREETINO_PROGRAM_ID}`,
          session.accessToken,
        )
      ).json();
      expect(page.total).toBe(2);
      expect(page.trees.map((t: { address: string }) => t.address)).toEqual([
        addresses[1],
      ]);
      const next = await (
        await get('client/trees?limit=1&offset=1', session.accessToken)
      ).json();
      expect(next.trees.map((t: { address: string }) => t.address)).toEqual([
        addresses[2],
      ]);
      expect(
        (await get(`client/trees/${addresses[0]}/reports`, session.accessToken))
          .status,
      ).toBe(404);
      const own = await (
        await get(`client/trees/${addresses[1]}/reports`, session.accessToken)
      ).json();
      expect(own.total).toBe(1);
      expect(own.reports[0]).toMatchObject({ address: report, wh: [1, 2] });
      for (const path of [
        'client/trees?limit=101',
        'client/trees?offset=-1',
        'client/trees/invalid/reports',
      ])
        expect((await get(path, session.accessToken)).status).toBe(400);
      expect((await get(`trees/${addresses[1]}/reports`)).status).toBe(200);
    } finally {
      await database.sql`DELETE FROM indexed_reports WHERE stream=${stream}`;
      await database.sql`DELETE FROM indexed_trees WHERE stream=${stream}`;
      await database.sql`DELETE FROM indexer_sources WHERE stream=${stream}`;
      await database.sql`DELETE FROM indexer_state WHERE stream=${stream}`;
      await indexer.onModuleInit();
    }
  });

  test('wallet challenge, JWT guard, replay protection and revocation', async () => {
    const keys = generateKeyPairSync('ed25519');
    const wallet = bs58.encode(
      keys.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32),
    );
    const post = (path: string, body: unknown) =>
      fetch(baseUrl + '/api/' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    const me = (token?: string) =>
      fetch(baseUrl + '/api/admin/me', {
        headers: token ? { Authorization: 'Bearer ' + token } : {},
      });
    expect((await me()).status).toBe(401);
    expect((await me('garbage')).status).toBe(401);
    expect((await post('auth/challenge', { wallet: 'invalid' })).status).toBe(
      400,
    );
    expect((await post('auth/login', {})).status).toBe(400);
    const challenge = async () => {
      const response = await post('auth/challenge', { wallet });
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain(wallet);
      const signature = bs58.encode(
        sign(null, Buffer.from(data.message), keys.privateKey),
      );
      return { challengeId: data.id, wallet, signature };
    };
    const unauthorized = await challenge();
    expect((await post('auth/login', unauthorized)).status).toBe(403);
    const [admin] =
      await database.sql`INSERT INTO admins (wallet) VALUES (${wallet}) RETURNING id, wallet`;
    expect(admin.id).toMatch(/^[0-9a-f-]{36}$/);
    const input = await challenge();
    const other = generateKeyPairSync('ed25519');
    const [row] =
      await database.sql`SELECT message FROM auth_challenges WHERE id = ${input.challengeId}`;
    expect(
      (
        await post('auth/login', {
          ...input,
          signature: bs58.encode(
            sign(null, Buffer.from(row.message), other.privateKey),
          ),
        })
      ).status,
    ).toBe(401);
    expect(
      (await post('auth/login', { ...input, signature: '!malformed' })).status,
    ).toBe(401);
    const results = await Promise.all([
      post('auth/login', input),
      post('auth/login', input),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 401]);
    const session = await results.find((r) => r.status === 201)!.json();
    expect(session.admin).toEqual({ id: admin.id, wallet });
    expect((await me(session.accessToken)).status).toBe(200);
    const reporterStatus = await fetch(
      baseUrl + '/api/admin/trees/' + TREETINO_PROGRAM_ID + '/mock-reporter',
      {
        headers: { Authorization: 'Bearer ' + session.accessToken },
      },
    );
    expect(reporterStatus.status).toBe(200);
    expect(await reporterStatus.json()).toEqual({ reporter: null });
    const authHeader = { Authorization: 'Bearer ' + session.accessToken };
    expect(
      (
        await fetch(
          baseUrl +
            '/api/admin/trees/' +
            TREETINO_PROGRAM_ID +
            '/report-simulation?day=2026-02-30',
          { headers: authHeader },
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await fetch(
          baseUrl +
            '/api/admin/trees/' +
            TREETINO_PROGRAM_ID +
            '/simulate-report',
          {
            method: 'POST',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ day: '2026-02-30' }),
          },
        )
      ).status,
    ).toBe(400);
    expect((await me(session.accessToken.slice(0, -4) + 'abcd')).status).toBe(
      401,
    );
    const expiredToken = await new SignJWT({ wallet, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(admin.id)
      .setIssuer('treetino')
      .setAudience('treetino-admin')
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) - 10)
      .sign(new TextEncoder().encode('test-only-secret-32-bytes-or-longer'));
    expect((await me(expiredToken)).status).toBe(401);
    const expiredChallenge = await challenge();
    await database.sql`UPDATE auth_challenges SET expires_at = 0 WHERE id = ${expiredChallenge.challengeId}`;
    expect((await post('auth/login', expiredChallenge)).status).toBe(401);
    await database.sql`DELETE FROM admins WHERE id = ${admin.id}`;
    expect((await me(session.accessToken)).status).toBe(403);
    let rateLimited = false;
    for (let attempt = 0; attempt < 21; attempt++) {
      if ((await post('auth/challenge', { wallet })).status === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
    expect((await fetch(baseUrl + '/api/trees')).status).toBe(200);
  });

  test('reports are public while reporter preparation and status require an admin JWT', async () => {
    expect(
      (
        await fetch(baseUrl + '/api/admin/mock-reporters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ treeId: '1' }),
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await fetch(
          baseUrl +
            '/api/admin/trees/' +
            TREETINO_PROGRAM_ID +
            '/mock-reporter',
        )
      ).status,
    ).toBe(401);
    expect(
      await (
        await fetch(baseUrl + '/api/trees/' + TREETINO_PROGRAM_ID + '/reports')
      ).json(),
    ).toEqual({ reports: [], total: 0 });
    for (const path of [
      'invalid/reports',
      TREETINO_PROGRAM_ID + '/reports?limit=101',
      TREETINO_PROGRAM_ID + '/reports?offset=-1',
    ])
      expect((await fetch(baseUrl + '/api/trees/' + path)).status).toBe(400);
  });

  test('serves the health endpoint', async () => {
    const response = await fetch(baseUrl + '/api/health');
    expect(response.status).toBe(200);
    expect((await response.json()) as ApiHealth).toEqual({
      status: 'ok',
      service: 'treetino-backend',
    });
  });

  test('serves Swagger UI, assets, and documented API schemas', async () => {
    const ui = await fetch(baseUrl + '/api/docs');
    expect(ui.status).toBe(200);
    expect(await ui.text()).toContain('swagger-ui');
    expect(
      (await fetch(baseUrl + '/api/docs/swagger-ui-bundle.js')).status,
    ).toBe(200);
    const response = await fetch(baseUrl + '/api/docs-json');
    expect(response.status).toBe(200);
    const document = await response.json();
    expect(Object.keys(document.paths).sort()).toEqual([
      '/api/admin/me',
      '/api/admin/mock-reporters',
      '/api/admin/trees/{address}/mock-reporter',
      '/api/admin/trees/{address}/report-simulation',
      '/api/admin/trees/{address}/simulate-report',
      '/api/auth/challenge',
      '/api/auth/client/challenge',
      '/api/auth/client/login',
      '/api/auth/login',
      '/api/campaigns',
      '/api/campaigns/{id}',
      '/api/client/me',
      '/api/client/trees',
      '/api/client/trees/{address}/reports',
      '/api/events',
      '/api/events/status',
      '/api/health',
      '/api/protocol',
      '/api/trees',
      '/api/trees/{address}/reports',
      '/api/victron/demos',
    ]);
    const parameters = document.paths['/api/trees'].get.parameters;
    expect(
      document.paths[
        '/api/admin/trees/{address}/report-simulation'
      ].get.parameters.find((p: { name: string }) => p.name === 'day'),
    ).toMatchObject({
      required: true,
      schema: { type: 'string', format: 'date' },
    });
    expect(
      document.components.schemas.SimulateReportDto.properties.day.format,
    ).toBe('date');
    expect(
      parameters.find(
        (parameter: { name: string }) => parameter.name === 'phase',
      ).schema.enum,
    ).toEqual(['funding', 'funded', 'purchased', 'active']);
    expect(
      parameters.find(
        (parameter: { name: string }) => parameter.name === 'limit',
      ).schema,
    ).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      default: 100,
    });
    expect(document.components.schemas.TreeDto.properties.target.type).toBe(
      'string',
    );
    expect(document.components.schemas.TreeDto.properties.id.format).toBe(
      'uuid',
    );
    expect(
      document.components.schemas.IndexerStatusDto.properties.cursor.nullable,
    ).toBe(true);
  });

  test('resolves Nest dependency injection and uses the generated program address', async () => {
    const response = await fetch(baseUrl + '/api/protocol');
    expect(response.status).toBe(200);
    expect((await response.json()) as ProtocolInfo).toEqual({
      name: 'treetino',
      network: 'devnet',
      programId: TREETINO_PROGRAM_ID,
    });
  });

  test('serves indexer status and validates history pagination', async () => {
    const status = await fetch(baseUrl + '/api/events/status');
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({
      enabled: false,
      cursor: null,
      events: 0,
    });
    expect(await (await fetch(baseUrl + '/api/events')).json()).toEqual({
      events: [],
      nextCursor: 0,
    });
    for (const query of ['after=-1', 'limit=1001', 'after=1.5', 'limit=abc']) {
      expect((await fetch(baseUrl + '/api/events?' + query)).status).toBe(400);
    }
  });

  test('serves public clean energy campaigns and detail dossiers', async () => {
    const listRes = await fetch(baseUrl + '/api/campaigns');
    expect(listRes.status).toBe(200);
    const data = await listRes.json();
    expect(data.campaigns.length).toBeGreaterThanOrEqual(4);
    const offgrid = data.campaigns.find(
      (c: { victronSiteId: number }) => c.victronSiteId === 209689,
    );
    expect(offgrid).toMatchObject({
      title: 'Wind Park Kryry 4.0 MW (Vestas V80)',
      category: 'Utility Wind Turbines',
      projectedApy: '14.2%',
      city: 'Kryry',
      country: 'Czech Republic',
    });

    const detailRes = await fetch(baseUrl + '/api/campaigns/209689');
    expect(detailRes.status).toBe(200);
    const detail = await detailRes.json();
    expect(detail.title).toBe('Wind Park Kryry 4.0 MW (Vestas V80)');
    expect(detail.tariffRate).toContain('€88.00');

    const notFound = await fetch(baseUrl + '/api/campaigns/missing-tree-999');
    expect(notFound.status).toBe(404);

    // Verify unauthenticated campaign creation is rejected
    const unauthPost = await fetch(baseUrl + '/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        treeAddress: 'lisbon_tree_123',
        title: 'Lisbon Solar Carport',
        category: 'Solar Carport',
        categoryBadge: 'Solar Carport',
        narrative: 'Urban charging and clean solar carport.',
        city: 'Lisbon',
        country: 'Portugal',
        projectedApy: '13.5%',
        tariffRate: '$0.36 / kWh',
        offTakerName: 'Lisbon Metro Hub',
        targetUsdc: '45000',
      }),
    });
    expect(unauthPost.status).toBe(401);

    // Create an admin and generate a valid JWT token
    const adminWallet = 'AdminWalletForCampaignTesting1111111111111111';
    const [adminRow] =
      await database.sql`INSERT INTO admins (wallet) VALUES (${adminWallet}) RETURNING id, wallet`;
    const adminToken = await new SignJWT({
      wallet: adminWallet,
      role: 'admin',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(adminRow.id)
      .setIssuer('treetino')
      .setAudience('treetino-admin')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode('test-only-secret-32-bytes-or-longer'));

    // Authenticated creation succeeds
    const createRes = await fetch(baseUrl + '/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        treeAddress: 'lisbon_tree_123',
        treeId: '5',
        title: 'Lisbon Solar Carport',
        subtitle: 'Urban Transit Hub Clean Energy',
        category: 'Solar Carport',
        categoryBadge: 'Solar Carport',
        narrative: 'High-traffic urban charging with commercial PPA.',
        story: 'Detailed hardware story in Lisbon.',
        city: 'Lisbon',
        country: 'Portugal',
        projectedApy: '13.5%',
        tariffRate: '$0.36 / kWh',
        offTakerName: 'Lisbon Metro Hub',
        targetUsdc: '45000',
      }),
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    expect(created.title).toBe('Lisbon Solar Carport');

    // Authenticated update via PUT succeeds
    const updateRes = await fetch(baseUrl + '/api/campaigns/lisbon_tree_123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        treeAddress: 'lisbon_tree_123',
        treeId: '5',
        title: 'Lisbon Solar Carport (Phase 2)',
        subtitle: 'Expanded Capacity Hub',
        category: 'Solar Carport',
        categoryBadge: 'Solar Carport',
        narrative: 'Expanded 80 kW canopy installation.',
        story: 'Upgraded hardware specifications.',
        city: 'Lisbon',
        country: 'Portugal',
        projectedApy: '14.0%',
        tariffRate: '$0.38 / kWh',
        offTakerName: 'Lisbon Metro Hub & Fleet',
        targetUsdc: '60000',
      }),
    });
    expect(updateRes.status).toBe(200);
    const updated = await updateRes.json();
    expect(updated.title).toBe('Lisbon Solar Carport (Phase 2)');
    expect(updated.projectedApy).toBe('14.0%');

    // GET lists the new campaign
    const getList = await fetch(baseUrl + '/api/campaigns');
    const listBody = await getList.json();
    const foundLisbon = listBody.campaigns.find(
      (c: { treeAddress: string }) => c.treeAddress === 'lisbon_tree_123',
    );
    expect(foundLisbon).toBeDefined();
    expect(foundLisbon.title).toBe('Lisbon Solar Carport (Phase 2)');
  });
});
