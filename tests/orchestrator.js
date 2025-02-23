import retry from 'async-retry';
import database from 'infra/database';
import migrator from 'models/migrator';

const baseUrl = 'http://localhost:3000'; // process.env.BASE_URL;

async function waitForAllServices() {
  await waitForWebServer();

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
}

async function clearDatabase() {
  await database.query('drop schema public cascade; create schema public;');
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
};

export default orchestrator;
