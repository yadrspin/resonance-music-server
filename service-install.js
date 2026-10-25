import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverScript = path.join(__dirname, 'server.js');

if (!fs.existsSync(serverScript)) {
  console.error('[ERROR] Файл server.js не найден. Пожалуйста, выполните: npm run build');
  process.exit(1);
}

const svc = new Service({
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
    },
    {
      name: 'PORT',
      value: process.env.PORT || '3000'
    },
    {
      name: 'MUSIC_DIR',
      value: process.env.MUSIC_DIR || ''
    },
    {
      name: 'DATA_DIR',
      value: process.env.DATA_DIR || ''
    }
  ]
});

svc.on('install', () => {
  console.log('\n========================================================');
  console.log('  [УСПЕХ] Служба Resonance Music Server установлена!');
  console.log('  Служба запускается автоматически при старте Windows.');
  console.log('========================================================\n');
  console.log('[INFO] Запуск службы в фоновом режиме...');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('\n[INFO] Служба уже установлена в системе Windows.');
  console.log('[INFO] Перезапуск службы...');
  svc.start();
});

svc.on('start', () => {
  console.log('\n========================================================');
  console.log('  [РАБОТАЕТ] Служба успешно запущена в фоне!');
  console.log('  Откройте в браузере: http://localhost:' + (process.env.PORT || '3000'));
  console.log('  Вы можете проверить службу в Windows: Win+R -> services.msc');
  console.log('========================================================\n');
});

svc.on('error', (err) => {
  console.error('[ERROR] Ошибка службы:', err);
});

console.log('[Resonance] Установка службы Windows...');
svc.install();
