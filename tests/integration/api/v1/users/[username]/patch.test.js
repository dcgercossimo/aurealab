import password from 'models/password';
import user from 'models/user';
import orchestrator from 'tests/orchestrator.js';
import { version as uuidVersion } from 'uuid';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe('PATCH /api/v1/users[username]', () => {
  describe('Anonymous user', () => {
    test('With nonexistent `username`,', async () => {
      const response = await fetch('http://localhost:3000/api/v1/users/UsuarioNaoExiste', {
        method: 'PATCH',
      });
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: 'NotFoundError',
        message: 'Usuário não encontrado',
        action: 'Verifique se o username está correto e tente novamente',
        statusCode: 404,
      });
    }, 6000);

    test('Duplicated username,', async () => {
      const responseUser1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'User1',
          email: 'user1@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(responseUser1.status).toBe(201);

      const responseUser2 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'User2',
          email: 'user2@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(responseUser2.status).toBe(201);

      const response = await fetch('http://localhost:3000/api/v1/users/user2', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'User1',
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: 'ValidationError',
        message: 'O Username informado já está em uso',
        action: 'Utilize outro username para realizar esta operação',
        statusCode: 400,
      });
    }, 6000);

    test('Duplicated e-mail,', async () => {
      const responseEmail1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Email1',
          email: 'email1@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(responseEmail1.status).toBe(201);

      const responseEmail2 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Email2',
          email: 'email2@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(responseEmail2.status).toBe(201);

      const response = await fetch('http://localhost:3000/api/v1/users/Email2', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'email1@aurealab.com.br',
        }),
      });
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        name: 'ValidationError',
        message: 'O e-mail informado já está em uso',
        action: 'Utilize outro e-mail para realizar esta operação',
        statusCode: 400,
      });
    }, 6000);

    test('With unique username,', async () => {
      const responseUniqueUser1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'UniqueUser1',
          email: 'uniqueuser1@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(responseUniqueUser1.status).toBe(201);

      const response = await fetch('http://localhost:3000/api/v1/users/UniqueUser1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'UniqueUser2',
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'UniqueUser2',
        email: 'uniqueuser1@aurealab.com.br',
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    }, 6000);

    test('With unique email,', async () => {
      const responseUniqueUser1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'UniqueEmail1',
          email: 'uniqueemail1@aurealab.com.br',
          password: '123456',
        }),
      });
      expect(responseUniqueUser1.status).toBe(201);

      const response = await fetch('http://localhost:3000/api/v1/users/UniqueEmail1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'Uniqueemail2@aurealab.com.br',
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'UniqueEmail1',
        email: 'uniqueemail2@aurealab.com.br',
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    }, 6000);

    test('With new password,', async () => {
      const responseUniqueUser1 = await fetch('http://localhost:3000/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'NewPassword1',
          email: 'newpassword1@aurealab.com.br',
          password: 'NewPassword1',
        }),
      });
      expect(responseUniqueUser1.status).toBe(201);

      const response = await fetch('http://localhost:3000/api/v1/users/NewPassword1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'NewPassword2',
        }),
      });
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: 'NewPassword1',
        email: 'newpassword1@aurealab.com.br',
        password: responseBody.password,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);

      const userInDatabase = await user.readOneByUsername('NewPassword1');
      const correctPassword = await password.compare('NewPassword2', userInDatabase.password);
      const incorrectPassword = await password.compare('senhaErrada', userInDatabase.password);

      expect(correctPassword).toBe(true);
      expect(incorrectPassword).toBe(false);
    }, 6000);
  });
});
