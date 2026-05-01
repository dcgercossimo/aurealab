import session from 'models/session';
import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';
import setCookieParser from 'set-cookie-parser';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('DELETE /api/v1/sessions', () => {
  describe('Default user', () => {
    test('With noexistent session,', async () => {
      const noneexistentToken =
        'adb186821911dbc10a73928ea425f8be9a25205b0f2ca5d5e95830bcc7c83e3bfc71600eceb156e15e3e928aed931fce';

      const respose = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'DELETE',
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

      const respose = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'DELETE',
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
    });

    test('With valid session,', async () => {
      const createdUser = await orchestrator.createUser({
        username: 'UserWithValidSessionToDelete',
      });

      const sessionObject = await orchestrator.createSession(createdUser.id);

      const respose = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'DELETE',
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(respose.status).toBe(200);

      const responseBody = await respose.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      // Assert that the session is expired
      expect(new Date(responseBody.expires_at) < new Date(sessionObject.expires_at)).toEqual(true);
      expect(new Date(responseBody.updated_at) > new Date(sessionObject.updated_at)).toEqual(true);

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

      const doublrCheckResponse = await fetch('http://localhost:3000/api/v1/user', {
        headers: {
          Cookie: `session_id=${sessionObject.token}`,
        },
      });
      expect(doublrCheckResponse.status).toBe(401);

      const doubleCheckResponseBody = await doublrCheckResponse.json();
      expect(doubleCheckResponseBody).toEqual({
        name: 'UnauthorizedError',
        message: 'Usuário não possui sessão ativa',
        action: 'Verifique se o usuário está logado e tente novamente',
        statusCode: 401,
      });
    });
  });
});
