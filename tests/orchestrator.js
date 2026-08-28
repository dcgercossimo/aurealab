import retry from 'async-retry';
import { faker } from '@faker-js/faker';

import database from 'infra/database';
import migrator from 'models/migrator';
import user from 'models/user';
import session from 'models/session';

const baseUrl = `http://${process.env.BASE_HTTP_HOST}:${process.env.BASE_HTTP_PORT}`;
const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch(`${baseUrl}/api/v1/status`);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailStatusPage() {
      const response = await fetch(`${emailHttpUrl}`);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query('drop schema public cascade; create schema public;');
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    username: userObject?.username || faker.internet.username().replace(/[^a-zA-Z0-9]/g, ''),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || 'validPassword',
  });
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: 'DELETE',
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmail = emailListBody.pop();
  const lastEmailResponse = await fetch(`${emailHttpUrl}/messages/${lastEmail.id}.plain`);
  const lastEmailBody = await lastEmailResponse.text();
  lastEmail.text = lastEmailBody;
  return lastEmail;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
};

export default orchestrator;
