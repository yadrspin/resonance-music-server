import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverScript = path.join(__dirname, 'server.js');

if (!fs.existsSync(serverScript)) {
  console.error('[ERROR] Файл server.js не найден. Пожалуйста, выполните: npm run build');
  process.exit(1);
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function askPassword(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin, output: process.stdout });
      rl.question('', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
      return;
    }

    const isRaw = stdin.isRaw;
    if (stdin.setRawMode) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.setEncoding('utf-8');

    let password = '';
    const onData = (ch) => {
      ch = ch.toString('utf-8');
      if (ch === '\n' || ch === '\r' || ch === '\u0004') {
        if (stdin.setRawMode) stdin.setRawMode(isRaw);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      } else if (ch === '\u0008' || ch === '\x7f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (ch === '\u0003') {
        process.exit(0);
      } else {
        password += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', onData);
  });
}

async function main() {
  console.log('\n========================================================');
  console.log('  Resonance - Настройка службы Windows                  ');
  console.log('========================================================\n');
  console.log('💡 Если ваша музыка находится на сетевом диске (например, N:\\),');
  console.log('   службе рекомендуется запускаться от вашей учетной записи Windows.\n');

  const defaultUser = process.env.USERNAME || '';
  const wantUser = await askQuestion(
    `Запустить службу от имени конкретного пользователя? [Y/n] (по умолчанию: Y): `
  );

  let chosenAccount = '';
  let chosenPassword = '';

  const isYes = wantUser === '' || wantUser.toLowerCase() === 'y' || wantUser.toLowerCase() === 'yes' || wantUser.toLowerCase() === 'д';

  if (isYes) {
    const userPrompt = defaultUser 
      ? `Имя пользователя Windows [${defaultUser}]: ` 
      : `Имя пользователя Windows: `;
    const inputUser = await askQuestion(userPrompt);
    chosenAccount = inputUser || defaultUser;

    if (chosenAccount) {
      chosenPassword = await askPassword(`Пароль для учетной записи "${chosenAccount}": `);
    }
  }

  const svcConfig = {
    name: 'ResonanceMusicServer',
    displayName: 'Resonance Music Server',
    description: 'Folder-First Hi-Fi Music Streaming Server',
    script: serverScript,
    wait: 2,
    grow: 0.5,
    maxRestarts: 10,
    env: [
      {
        name: 'NODE_ENV',
        value: 'production'
      }
    ]
  };

  const svc = new Service(svcConfig);

  if (chosenAccount && chosenPassword) {
    let domain = '.';
    let accountName = chosenAccount;
    if (chosenAccount.includes('\\')) {
      const parts = chosenAccount.split('\\');
      domain = parts[0];
      accountName = parts[1];
    }
    svc.logOnAs = {
      domain: domain,
      account: accountName,
      password: chosenPassword,
      allowServiceLogon: true
    };
    console.log(`\n[INFO] Служба будет настроена для запуска от: ${domain}\\${accountName}`);
  } else {
    console.log('\n[INFO] Служба будет запущена от имени: Локальная система (Local System)');
  }

  svc.on('install', () => {
    console.log('\n========================================================');
    console.log('  [УСПЕХ] Служба Resonance Music Server зарегистрирована!');
    console.log('  Служба настроена на автозапуск при старте Windows.');
    console.log('========================================================\n');

    if (chosenAccount && chosenPassword) {
      try {
        const fullAccount = chosenAccount.includes('\\') ? chosenAccount : `.\\${chosenAccount}`;
        execSync(`sc.exe config ResonanceMusicServer obj= "${fullAccount}" password= "${chosenPassword}"`, { stdio: 'ignore' });
        console.log(`[OK] Учетные данные пользователя применены в реестре Windows.`);
      } catch (e) {}
    }

    console.log('[INFO] Запуск службы в фоновом режиме...');
    svc.start();
  });

  svc.on('alreadyinstalled', () => {
    console.log('\n[INFO] Служба уже установлена в системе Windows.');
    if (chosenAccount && chosenPassword) {
      try {
        const fullAccount = chosenAccount.includes('\\') ? chosenAccount : `.\\${chosenAccount}`;
        execSync(`sc.exe config ResonanceMusicServer obj= "${fullAccount}" password= "${chosenPassword}"`, { stdio: 'ignore' });
        console.log(`[OK] Учетные данные пользователя обновлены.`);
      } catch (e) {}
    }
    console.log('[INFO] Перезапуск службы...');
    svc.start();
  });

  svc.on('start', () => {
    console.log('\n========================================================');
    console.log('  [РАБОТАЕТ] Служба успешно запущена в фоне!');
    console.log('  Откройте в браузере: http://localhost:3000');
    console.log('========================================================\n');
  });

  svc.on('error', (err) => {
    console.error('[ERROR] Ошибка службы:', err);
  });

  console.log('[Resonance] Установка службы Windows...');
  svc.install();
}

main().catch(err => {
  console.error('Ошибка установки службы:', err);
});
