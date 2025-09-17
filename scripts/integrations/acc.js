import {custom} from '../events/custom.js';
import {genericUtils} from '../utils.js';
let packs = [
    {
        key: 'ACCItems',
        type: 'item'
    }
];
let accItems = [];
async function init() {
    await Promise.all(packs.map(async i => {
        let pack = game.packs.get('automated-crafted-creations.' + i.key);
        if (!pack) return;
        let index = await pack.getIndex({fields: ['name', 'type', 'flags.chris-premades.info.version', 'flags.chris-premades.info.identifier', 'system.source.rules']});
        index.forEach(j => {
            let identifier = j.flags['chris-premades']?.info?.identifier;
            if (!identifier) return;
            let rules = j.system.source.rules === '2024' ? 'modern' : 'legacy';
            let macro = custom.getMacro(identifier, rules);
            accItems.push({
                name: j.name,
                version: macro.version,
                uuid: j.uuid,
                type: j.type,
                rules
            });
        });
    }));
}
export let acc = {
    init,
    accItems
};