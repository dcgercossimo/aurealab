import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('GET /api/v1/users[username]', () => {
  describe('Anonymous user', () => {
    test('With exact case match,', async () => {
      await orchestrator.createUser({
        username: 'MesmoCase',
      });

      const response2 = await fetch('http://localhost:3000/api/v1/users/MesmoCase');
      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: 'MesmoCase',
        email: responseBody2.email,
        password: responseBody2.password,
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });

      expect(uuidVersion(responseBody2.id)).toBe(4);
      expect(Date.parse(responseBody2.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody2.updated_at)).not.toBeNaN();
    }, 6000);

    test('With exact case mismatch,', async () => {
      await orchestrator.createUser({
        username: 'CaseDiferente',
      });

      const response2 = await fetch('http://localhost:3000/api/v1/users/casediferente');
      expect(response2.status).toBe(200);

      const responseBody2 = await response2.json();
      expect(responseBody2).toEqual({
        id: responseBody2.id,
        username: 'CaseDiferente',
        email: responseBody2.email,
        password: responseBody2.password,
        created_at: responseBody2.created_at,
        updated_at: responseBody2.updated_at,
      });
    }, 6000);

    test('With nonexistent username,', async () => {
      const response = await fetch('http://localhost:3000/api/v1/users/UsuarioNaoExiste');
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: 'Usuário não encontrado',
        action: 'Verifique se o username está correto e tente novamente',
        statusCode: 404,
      });
    }, 6000);
  });
});
