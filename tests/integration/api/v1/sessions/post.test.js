import session from 'models/session';
import setCookieParser from 'set-cookie-parser';
import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/sessions', () => {
  describe('Anonymous user', () => {
    test('With incorrect `e-mail` but correct `password`', async () => {
      await orchestrator.createUser({
        password: 'senhaCerta',
      });

      const resp = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailerrado@aurealab.com.br',
          password: 'senhaCerta',
        }),
      });
      expect(resp.status).toBe(401);

      const responseBody = await resp.json();
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        message: 'E-mail ou senha incorretos',
        action: 'Verifique os dados informados e tente novamente',
        statusCode: 401,
      });
    }, 6000);

    test('With correct `e-mail` but incorrect `password`', async () => {
      await orchestrator.createUser({
        email: 'emailcorreto@aurealab.com.br',
      });

      const resp = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailcorreto@aurealab.com.br',
          password: 'senhaErrada',
        }),
      });
      expect(resp.status).toBe(401);

      const responseBody = await resp.json();
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        message: 'E-mail ou senha incorretos',
        action: 'Verifique os dados informados e tente novamente',
        statusCode: 401,
      });
    }, 6000);

    test('With incorrect `e-mail` and incorrect `password`', async () => {
      await orchestrator.createUser();

      const resp = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'emailincorreto@aurealab.com.br',
          password: 'senhaErrada',
        }),
      });
      expect(resp.status).toBe(401);

      const responseBody = await resp.json();
      expect(responseBody).toEqual({
        name: 'UnauthorizedError',
        message: 'E-mail ou senha incorretos',
        action: 'Verifique os dados informados e tente novamente',
        statusCode: 401,
      });
    }, 6000);

    test('With correct `e-mail` and correct `password`', async () => {
      const createdUser = await orchestrator.createUser({
        email: 'tudoCorreto@aurealab.com.br',
        password: 'tudoCorreto',
      });

      const resp = await fetch('http://localhost:3000/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'tudocorreto@aurealab.com.br',
          password: 'tudoCorreto',
        }),
      });
      expect(resp.status).toBe(201);

      const responseBody = await resp.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        token: responseBody.token,
        user_id: createdUser.id,
        expires_at: responseBody.expires_at,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(responseBody.token).toHaveLength(96);
      expect(Date.parse(responseBody.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const expiresAt = new Date(responseBody.expires_at);
      const createdAt = new Date(responseBody.created_at);

      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);

      expect(expiresAt.getTime() - createdAt.getTime()).toBe(session.EXPIRATION_IN_MILLISECONDS);

      const parsedSetCookie = setCookieParser.parse(resp, {
        map: true,
      });

      expect(parsedSetCookie.session_id).toEqual({
        name: 'session_id',
        value: responseBody.token,
        httpOnly: true,
        maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
        path: '/',
      });
    }, 6000);
  });
});
