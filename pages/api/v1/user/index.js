import { createRouter } from 'next-connect';
import controller from 'infra/controller';
import user from 'models/user';
import session from 'models/session';

const router = createRouter();

router.get(getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const sessionToken = req.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  const renewedSessionObject = await session.renew(sessionObject.id);
  controller.setSessionCookie(res, renewedSessionObject.token);

  const userFound = await user.readOneById(sessionObject.user_id);
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');

  return res.status(200).json(userFound);
}
