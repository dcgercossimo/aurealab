import session from 'models/session';
import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';
import setCookieParser from 'set-cookie-parser';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/user', () => {
  describe('Default user', () => {
    test('With valid session,', async () => {
      const createdUser = await orchestrator.createUser({
        username: 'UserWithValidSession',
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const respose = await fetch('http://localhost:3000/api/v1/user', {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(respose.status).toBe(200);

      const cacheControl = respose.headers.get('Cache-Control');
      expect(cacheControl).toBe('no-store, max-age=0, must-revalidate');

      const responseBody = await respose.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: 'UserWithValidSession',
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(sessionObject.token);

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toEqual(true);
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toEqual(true);

      // Set-cookie assertions
      const parsedSetCookie = setCookieParser.parse(respose, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: 'session_id',
        value: sessionObject.token,
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
      });
    });

    test('With noexistent session,', async () => {
      const noneexistentToken =
        'adb186821911dbc10a73928ea425f8be9a25205b0f2ca5d5e95830bcc7c83e3bfc71600eceb156e15e3e928aed931fce';

      const respose = await fetch('http://localhost:3000/api/v1/user', {
        headers: {
          Cookie: `session_id=${noneexistentToken}`,
        },
      });
      expect(respose.status).toBe(401);

      const responseBody = await respose.json();
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não possui sessão ativa',
        action: 'Verifique se o usuário está logado e tente novamente',
        statusCode: 401,
      });

      // Set-cookie assertions
      const parsedSetCookie = setCookieParser.parse(respose, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: 'session_id',
        value: 'invalid',
        httpOnly: true,
        maxAge: -1,
        path: '/',
      });
    });

    test('With expired session,', async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - session.EXPIRATION_IN_MILLISECONDS),
      });
      const createdUser = await orchestrator.createUser({
        username: 'UserWithExpiredSession',
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const respose = await fetch('http://localhost:3000/api/v1/user', {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(respose.status).toBe(401);

      const responseBody = await respose.json();
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não possui sessão ativa',
        action: 'Verifique se o usuário está logado e tente novamente',
        statusCode: 401,
      });

      // Set-cookie assertions
      const parsedSetCookie = setCookieParser.parse(respose, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: 'session_id',
        value: 'invalid',
        httpOnly: true,
        maxAge: -1,
        path: '/',
      });
    });

    test('With session expiring,', async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - getDaysInMilliseconds(29.9999)),
      });
      const createdUser = await orchestrator.createUser({
        username: 'UserWithSessionExpiring',
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      jest.useRealTimers();

      const respose = await fetch('http://localhost:3000/api/v1/user', {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(respose.status).toBe(200);

      const responseBody = await respose.json();

      expect(responseBody).toEqual({
        id: createdUser.id,
        username: 'UserWithSessionExpiring',
        email: createdUser.email,
        password: createdUser.password,
        created_at: createdUser.created_at.toISOString(),
        updated_at: createdUser.updated_at.toISOString(),
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Session renewal assertions
      const renewedSessionObject = await session.findOneValidByToken(sessionObject.token);

      expect(renewedSessionObject.expires_at > sessionObject.expires_at).toEqual(true);
      expect(renewedSessionObject.expires_at < new Date(Date.now() + getDaysInMilliseconds(30))).toEqual(true);
      expect(renewedSessionObject.updated_at > sessionObject.updated_at).toEqual(true);

      // Set-cookie assertions
      const parsedSetCookie = setCookieParser.parse(respose, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: 'session_id',
        value: sessionObject.token,
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
      });
    });
  });
});

function getDaysInMilliseconds(days) {
  return days * 24 * 60 * 60 * 1000;
}
