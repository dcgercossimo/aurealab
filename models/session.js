import crypto from 'node:crypto';
import database from 'infra/database';
import { UnauthorizedError } from 'infra/errors';

const EXPIRATION_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function create(userId) {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = getExpiresAt();
  const newSession = await runInsertQuery(token, userId, expiresAt);
  return newSession;
}

async function runInsertQuery(token, userId, expiresAt) {
  const results = await database.query({
    text: `
      INSERT INTO
        sessions (token, user_id, expires_at)
      VALUES
        ($1, $2, $3)
      RETURNING
        *;
    `,
    values: [token, userId, expiresAt],
  });

  return results.rows[0];
}

async function findOneValidByToken(sessionToken) {
  const sessionFound = await runSelectQuery(sessionToken);

  if (!sessionFound) {
    throw new UnauthorizedError({
      message: 'Usuário não possui sessão ativa',
      action: 'Verifique se o usuário está logado e tente novamente',
    });
  }
  return sessionFound;

  async function runSelectQuery(sessionToken) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM sessions
        WHERE
          token = $1
          AND expires_at > NOW()
        LIMIT 1;
      `,
      values: [sessionToken],
    });

    return results.rows[0];
  }
}

async function renew(sessionId) {
  const expiresAt = getExpiresAt();
  const renewedSessionObject = await runUpdateQuery(sessionId, expiresAt);
  return renewedSessionObject;

  async function runUpdateQuery(sessionId, expiresAt) {
    const results = await database.query({
      text: `UPDATE
              sessions
            SET
              expires_at = $2,
              updated_at = NOW()
            WHERE
              id = $1
            RETURNING
              *;`,
      values: [sessionId, expiresAt],
    });

    return results.rows[0];
  }
}

function expireById(sessionId) {
  const expiredSessionObject = runUpdateQuery(sessionId);
  return expiredSessionObject;

  async function runUpdateQuery(sessionId) {
    const results = await database.query({
      text: `UPDATE
              sessions
            SET
              expires_at = expires_at - INTERVAL '1 year',
              updated_at = NOW()
            WHERE
              id = $1
            RETURNING
              *;`,
      values: [sessionId],
    });
    return results.rows[0];
  }
}

function getExpiresAt() {
  return new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);
}

const session = {
  create,
  findOneValidByToken,
  renew,
  expireById,
  EXPIRATION_IN_MILLISECONDS,
};

export default session;
