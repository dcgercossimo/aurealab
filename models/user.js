import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors.js';
import password from './password.js';

async function create(userInput) {
  await validateUniqueEmail(userInput.email);
  await validateUniqueUsername(userInput.username);
  await hashPasswordInObject(userInput);

  const newUser = await runInsertQuery(userInput);
  return newUser;

  async function validateUniqueEmail(email) {
    const user = await findOneByEmail(email);
    if (user) {
      throw new ValidationError({
        message: 'O e-mail informado já está em uso',
        action: 'Utilize outro e-mail para realizar o cadastro',
      });
    }
  }

  async function validateUniqueUsername(username) {
    const user = await findOneByUsername(username);
    if (user) {
      throw new ValidationError({
        message: 'O Username informado já está em uso',
        action: 'Utilize outro username para realizar o cadastro',
      });
    }
  }

  async function hashPasswordInObject(userInput) {
    const hashedPassword = await password.hash(userInput.password);
    userInput.password = hashedPassword;
  }

  async function runInsertQuery(userInput) {
    const { username, email, password } = userInput;
    const results = await database.query({
      text: `
        INSERT INTO
          users (username, email, password)
        VALUES
          ($1, LOWER($2), $3)
        RETURNING
          *
        ;`,
      values: [username, email, password],
    });
    return results.rows[0];
  }
}

async function readOneByUsername(username) {
  const userFound = await findOneByUsername(username);
  if (!userFound) {
    throw new NotFoundError({
      message: 'Usuário não encontrado',
      action: 'Verifique se o username está correto e tente novamente',
    });
  }
  return userFound;
}

async function findOneByEmail(email) {
  const results = await database.query({
    text: `
      SELECT
        id, username, email, password, created_at, updated_at
      FROM
        users
      WHERE
        email = LOWER($1)
      LIMIT
        1
      ;`,
    values: [email],
  });
  return results.rows[0];
}

async function findOneByUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        id, username, email, password, created_at, updated_at
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      LIMIT
        1
      ;`,
    values: [username],
  });
  return results.rows[0];
}

const user = {
  create,
  readOneByUsername,
};

export default user;
