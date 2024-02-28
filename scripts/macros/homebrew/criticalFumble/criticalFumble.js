import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
import {queue} from '../../../utility/queue.js';
import {examples} from './examples.js';
async function getTableItems(type) {
    let packId = game.settings.get('chris-premades', type + ' Table');
    let pack = game.packs.get(packId);
    if (!pack) return undefined;
    return await pack.getIndex({'fields': ['uuid', 'system.description.value']});
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
async function selectAndUse(workflow, type, style) {
    let table = await getTableItems(type);
    if (!table) return;
    let selection;
    if (style === 2) {
        selection = await chris.selectDocument(type + ' Roll', table, false, true);
    } else {
        let gmId = chris.lastGM();
        await chris.gmDialogMessage();
        selection = await chris.remoteDocumentDialog(gmId, type + ' Roll', table);
        await chris.clearGMDialogMessage();
    }
    if (!selection) return;
    let featureData = await fromUuid(selection[0].uuid);
    delete featureData._id;
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    await await MidiQOL.completeItemUse(feature, config, options);
}
async function critical(workflow) {
    if (!workflow.isCritical || !workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'criticalTable', 50);
    if (!queueSetup) return;
    let style = game.settings.get('chris-premades', 'Use Critical Table');
    if (style === 1) {
        await rollAndUse(workflow, 'Critical');
    } else if (style === 2 || style === 3) {
        await selectAndUse(workflow, 'Critical');
    }
    queue.remove(workflow.item.uuid);
}
async function fumble(workflow) {
    if (!workflow.isFumble || !workflow.targets.size) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'fumbleTable', 50);
    if (!queueSetup) return;
    let style = game.settings.get('chris-premades', 'Use Fumble Table');
    if (style === 1) {
        await rollAndUse(workflow, 'Fumble');
    } else if (style === 2 || style === 3) {
        await selectAndUse(workflow, 'Fumble', style);
    }
    queue.remove(workflow.item.uuid);
}
export let criticalFumble = {
    'critical': critical,
    'fumble': fumble,
    'examples': examples
}