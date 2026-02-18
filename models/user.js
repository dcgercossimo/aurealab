import database from 'infra/database';
import { NotFoundError, ValidationError } from 'infra/errors.js';
import password from './password.js';

async function create(userInput) {
  await validateUniqueUsername(userInput.username);
  await validateUniqueEmail(userInput.email);
  await hashPasswordInObject(userInput);

  const newUser = await runInsertQuery(userInput);
  return newUser;

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

async function readOneByEmail(email) {
  const userFound = await findOneByEmail(email);
  if (!userFound) {
    throw new NotFoundError({
      message: 'Usuário não encontrado',
      action: 'Verifique se o Email está correto e tente novamente',
    });
  }
  return userFound;
}

async function update(username, userInputValues) {
  const currentUser = await readOneByUsername(username);

  if ('username' in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ('email' in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ('password' in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userNewValues);
  return updatedUser;

  async function runUpdateQuery(userNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          username = $2,
          email = LOWER($3),
          password = $4,
          updated_at = timezone('UTC', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        userNewValues.id,
        userNewValues.username,
        userNewValues.email,
        userNewValues.password || currentUser.password,
      ],
    });
    return results.rows[0];
  }
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

async function validateUniqueEmail(email) {
  const user = await findOneByEmail(email);
  if (user) {
    throw new ValidationError({
      message: 'O e-mail informado já está em uso',
      action: 'Utilize outro e-mail para realizar esta operação',
    });
  }
}

async function validateUniqueUsername(username) {
  const user = await findOneByUsername(username);
  if (user) {
    throw new ValidationError({
      message: 'O Username informado já está em uso',
      action: 'Utilize outro username para realizar esta operação',
    });
  }
}

async function hashPasswordInObject(userInput) {
  if (userInput.password === undefined) return;
  const hashedPassword = await password.hash(userInput.password);
  userInput.password = hashedPassword;
}

const user = {
  create,
  readOneByUsername,
  readOneByEmail,
  update,
};

export default user;
