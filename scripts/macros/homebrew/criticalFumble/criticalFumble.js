import {constants} from '../../../constants.js';
import {queue} from '../../../utility/queue.js';
import {examples} from './examples.js';
async function getTableItems(type) {
    let packId = game.settings.get('chris-premades', type + ' Table');
    let pack = game.packs.get(packId);
    if (!pack) return undefined;
    return await pack.getIndex({'fields': ['uuid']});
}
async function rollAndUse(workflow, type) {
    let table = await getTableItems(type);
    if (!table) return;
    let roll = await new Roll('1d' + table.size).roll({'async': true});
    let itemUuid = table.contents[roll.total - 1].uuid;
    let item = await fromUuid(itemUuid);
    let featureData = item.toObject();
    delete featureData._id;
    roll.toMessage({
        'rollMode': 'roll',
        'speaker': {'alias': name},
        'flavor': type + ': ' + item.name
    });
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    await await MidiQOL.completeItemUse(feature, config, options);
}
async function critical(workflow) {
    if (!workflow.isCritical || !workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'criticalTable', 50);
    if (!queueSetup) return;
    await rollAndUse(workflow, 'Critical');
    queue.remove(workflow.item.uuid);
}
async function fumble(workflow) {
    if (!workflow.isFumble || !workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'fumbleTable', 50);
    if (!queueSetup) return;
    await rollAndUse(workflow, 'Fumble');
    queue.remove(workflow.item.uuid);
}
export let criticalFumble = {
    'critical': critical,
    'fumble': fumble,
    'examples': examples
}