import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import input from 'input';

const apiId = 0;
const apiHash = '';

const stringSession = new StringSession('');

export async function tg_connect() {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Phone number: '),
    password: async () => await input.text('2FA password (if any): '),
    phoneCode: async () => await input.text('Code: '),
    onError: console.log,
  });

  console.log('Logged in!');
  console.log('Session:');
  console.log(client.session.save());
}
