import { NotFoundError, UnauthorizedError } from 'infra/errors';
import user from './user';
import password from './password';

async function getAuthenticatedUser(providedEmail, providedPassword) {
  try {
    const storedUser = await findUserByEmail(providedEmail);
    await validatePasssword(providedPassword, storedUser.password);
    return storedUser;
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        message: 'E-mail ou senha incorretos',
        action: 'Verifique os dados informados e tente novamente',
      });
    }

    throw error;
  }
}

async function findUserByEmail(providedEmail) {
  try {
    const storedUser = await user.readOneByEmail(providedEmail);
    return storedUser;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new UnauthorizedError({
        message: 'E-mail incorreto.',
        action: 'Verifique este dado está correto e tente novamente',
      });
    }

    throw error;
  }
}

async function validatePasssword(providedPassword, storedPassword) {
  const correctPasswordMatch = await password.compare(providedPassword, storedPassword);
  if (!correctPasswordMatch) {
    throw new UnauthorizedError({
      message: 'Senha incorreta.',
      action: 'Verifique este dado está correto e tente novamente',
    });
  }
}

const authentication = {
  getAuthenticatedUser,
};

export default authentication;
