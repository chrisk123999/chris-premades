import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    let id = chris.getConfiguration(workflow.item, 'id') ?? '';
    if (id != '') return;
    let validSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.system.uses.max === 1 && ['atwill', 'innate'].includes(i.system.preparation?.mode) && i.system.uses.per === 'sr');
    let spell;
    if (!validSpells.length) {
        ui.notifications.warn('No valid spells found!');
        return;
    } else {
        let selectedSpell = await chris.selectDocument('Select the associated spell for this feature:', validSpells, false, false, true);
        if (!selectedSpell) return;
        spell = selectedSpell[0];
    }
    await chris.setConfiguration(workflow.item, 'id', spell.id);
}
async function onUse({speaker, actor, token, character, item, args, scope, workflow}) {
    let feature = chris.getItem(workflow.actor, 'Aberrant Dragonmark');
    if (!feature) return;
    let id = chris.getConfiguration(feature, 'id');
    if (id === '' || workflow.item.id != id) return;
    let options = Object.values(workflow.actor.classes).filter(i => i.system.levels != i.system.hitDiceUsed).map(j => ([j.name + ' (' + j.system.hitDice + ') [' + (j.system.levels - j.system.hitDiceUsed) + ' / ' + j.system.levels + ']', j.system.hitDice]));
    options.push(['No', false]);
    console.log(options);
    if (options.length === 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'aberrantDragonmark', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, options, 'Expend one of your hit dice?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let die = await workflow.actor.rollHitDie(selection);
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Feat Features', 'Aberrant Dragonmark - Damage', false);
    if (!featureData) {
        queue.remove(workflow.item.uuid);
        return;
    }
    delete featureData._id;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Aberrant Dragonmark - Damage');
    let targetUuid;
    if (die.total % 2 === 0) {
        featureData.system.damage.parts[0] = [
            die.total + '[temphp]',
            'temphp'
        ];
        featureData.name = 'Aberrant Dragonmark - Healing';
        targetUuid = workflow.token.document.uuid;
    } else {
        featureData.system.damage.parts[0][0] = die.total + '[force]';
        let nearbyTargets = chris.findNearby(workflow.token, 30, 'enemy', true);
        if (nearbyTargets.length) {
            targetUuid = nearbyTargets[Math.floor((Math.random() * nearbyTargets.length))].document.uuid;
        } else {
            targetUuid = workflow.token.document.uuid;
        }
    }
    let featureItem = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    featureItem.prepareData();
    featureItem.prepareFinalAttributes();
    let [config, iOptions] = constants.syntheticItemWorkflowOptions([targetUuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(featureItem, config, iOptions);
    queue.remove(workflow.item.uuid);
}
export let aberrantDragonmark = {
    'item': item,
    'onUse': onUse
};