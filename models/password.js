import bcryptjs from 'bcryptjs';

async function hash(password) {
  const rounds = getNumberOfRounds();
  const pepper = getPepper();
  const passwordWithPepper = `${password}${pepper}`;
  return await bcryptjs.hash(passwordWithPepper, rounds);
}

function getNumberOfRounds() {
  return process.env.NODE_ENV === 'production' ? 14 : 1;
}

function getPepper() {
  return process.env.PEPPER || 'pimentinha';
}

async function compare(providedPassword, storePassword) {
  const pepper = getPepper();
  const passwordWithPepper = `${providedPassword}${pepper}`;
  return await bcryptjs.compare(passwordWithPepper, storePassword);
}

const password = {
  hash,
  compare,
};

export default password;
