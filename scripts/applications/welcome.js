import {genericUtils} from '../utils.js';
function checkStatus(key) {
    let module = game.module.get(key);
    let minimum = game.modules.get('chris-premades').relationships.requires.find(i => i.id === key)?.compatibility?.minimum;
    if (minimum && !module) return -1;
    if (!minimum && module) return 0;
    let current = module.version;
    if (genericUtils.isNewerVersion(minimum, current)) return -1;
    return 1;
}