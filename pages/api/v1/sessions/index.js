import { createRouter } from 'next-connect';
import * as cookie from 'cookie';
import controller from 'infra/controller';
import authentication from 'models/authentication';
import session from 'models/session';

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInput = req.body;

  const authenticatedUser = await authentication.getAuthenticatedUser(userInput.email, userInput.password);

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize('session_id', newSession.token, {
    httpOnly: true,
    path: '/',
    maxAge: session.EXPIRATION_IN_MILLISECONDS / 1000,
    secure: process.env.NODE_ENV === 'production',
  });

  res.setHeader('Set-Cookie', setCookie);

  return res.status(201).json(newSession);
}
