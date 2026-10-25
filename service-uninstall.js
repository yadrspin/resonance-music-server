import { Service } from 'node-windows';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverScript = path.join(__dirname, 'server.js');

const svc = new Service({
  name: 'ResonanceMusicServer',
  script: serverScript
});

svc.on('uninstall', () => {
  console.log('\n========================================================');
  console.log('  [УСПЕХ] Служба Resonance Music Server успешно удалена!');
  console.log('  Фоновый процесс остановлен.');
  console.log('========================================================\n');
});

svc.on('error', (err) => {
  console.error('[ERROR] Ошибка при удалении службы:', err);
});

console.log('[Resonance] Остановка и удаление службы Windows...');
svc.uninstall();
