import { createRouter } from 'next-connect';
import controller from 'infra/controller';
import user from 'models/user';

const router = createRouter();

router.get(getHandler).patch(patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(req, res) {
  const { username } = req.query;
  const userFound = await user.readOneByUsername(username);
  return res.status(200).json(userFound);
}

async function patchHandler(req, res) {
  const { username } = req.query;
  const userInpuptValues = req.body;
  const updatedUser = await user.update(username, userInpuptValues);
  return res.status(200).json(updatedUser);
}
