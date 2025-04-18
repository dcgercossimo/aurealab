import bcryptjs from 'bcryptjs';

async function hash(password) {
  const rounds = getNumberOfRounds();
  return await bcryptjs.hash(password, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === 'production' ? 14 : 1;
}

async function compare(providedPassword, storePassword) {
  return await bcryptjs.compare(providedPassword, storePassword);
}

const password = {
  hash,
  compare,
};

export default password;
