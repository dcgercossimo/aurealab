import { createRouter } from 'next-connect';
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

  controller.setSessionCookie(res, newSession.token);

  return res.status(201).json(newSession);
}
