import email from 'infra/email';
import orchestrator from 'tests/orchestrator';

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe('e-mail manager', () => {
  test('send', async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: 'Teste <test@example.com>',
      to: 'admin@aurealab.com.br',
      subject: 'Teste de Email',
      text: 'Conteúdo do e-mail.',
    });

    await email.send({
      from: 'Teste <test@example.com>',
      to: 'admin@aurealab.com.br',
      subject: 'Derradeiro e-mail',
      text: 'Conteúdo do derradeiro e-mail.',
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe('<test@example.com>');
    expect(lastEmail.recipients[0]).toBe('<admin@aurealab.com.br>');
    expect(lastEmail.subject).toBe('Derradeiro e-mail');
    expect(lastEmail.text).toBe('Conteúdo do derradeiro e-mail.\r\n');
  });
});
