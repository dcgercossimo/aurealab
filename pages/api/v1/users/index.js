import { createRouter } from 'next-connect';
import controller from 'infra/controller';
import user from 'models/user';

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(req, res) {
  const userInput = req.body;
  const newUser = await user.create(userInput);
  return res.status(201).json(newUser);
}
