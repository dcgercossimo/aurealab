import password from 'models/password';
import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('POST /api/v1/users', () => {
  describe('Anonymous user', () => {
    test('With unique and valid data', async () => {
      const resp = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'DanielGercossimo',
          email: 'dcgercossimo@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(resp.status).toBe(201);

      const responseBody = await resp.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'DanielGercossimo',
        email: 'dcgercossimo@aurealab.com.br',
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.readOneByUsername('DanielGercossimo');
      const correctPassword = await password.compare('123456', userInDatabase.password);

      const incorrectPassword = await password.compare('senhaErrada', userInDatabase.password);

      expect(correctPassword).toBe(true);
      expect(incorrectPassword).toBe(false);
    }, 6000);

    test('Duplicated e-mail,', async () => {
      const response1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'EmailDuplicado1',
          email: 'duplicado@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'EmailDuplicado2',
          email: 'Duplicado@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: 'ValidationError',
        message: 'O e-mail informado já está em uso',
        action: 'Utilize outro e-mail para realizar o cadastro',
        statusCode: 400,
      });
    }, 6000);

    test('Duplicated username,', async () => {
      const response1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'UsernameDuplicado',
          email: 'username1@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(response1.status).toBe(201);

      const response2 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'UserNameDuplicado',
          email: 'username2@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(response2.status).toBe(400);

      const response2Body = await response2.json();
      expect(response2Body).toEqual({
        name: 'ValidationError',
        message: 'O Username informado já está em uso',
        action: 'Utilize outro username para realizar o cadastro',
        statusCode: 400,
      });
    }, 6000);
  });
});
