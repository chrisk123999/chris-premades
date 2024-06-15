import {constants} from '../../../constants.js';
import {chris} from '../../../helperFunctions.js';
export async function cleave({speaker, actor, token, character, item, args, scope, workflow}) {
    let validTypes = [
        'battleaxe',
        'greataxe',
        'halberd',
        'greatsword'
    ];
    let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && validTypes.includes(i.system.type?.baseItem) && i.system.equipped);
    if (!validWeapons.length) {
        ui.notifications.info('No valid equipped weapons!');
        return;
    }
    let weapon;
    if (validWeapons.length === 1) weapon = validWeapons[0];
    if (!weapon) [weapon] = await chris.selectDocument('What weapon?', validWeapons);
    if (!weapon) return;
    let nearbyFoes = chris.findNearby(workflow.token, weapon.system.range.value, 'enemy', true);
    if (!nearbyFoes.length) {
        ui.notifications.info('No nearby enemies found!');
        return;
    }
    let targets;
    if (nearbyFoes.length > 3) {
        let selectedTargets = await chris.selectTarget('Choose your targets (Max: 3)', constants.okCancel, nearbyFoes, true, 'multiple');
        if (!selectedTargets.buttons) return;
        if (selectedTargets.inputs.filter(i => !!i).length > 3) {
            ui.notifications.info('Too many targets selected!');
            return;
        }
        targets = selectedTargets.inputs;
    } else {
        targets = nearbyFoes.map(i => i.document.uuid);
    }
    let featureData = duplicate(weapon.toObject());
    featureData.system.target.value = 3;
    delete featureData._id;
    for (let i = 0; i < featureData.system.damage.parts.length; i++) {
        featureData.system.damage.parts[i][0] = 'floor((' + featureData.system.damage.parts[i][0] + ') / 2)';
    }
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    feature.prepareData();
    feature.prepareFinalAttributes();
    let [config, options] = constants.syntheticItemWorkflowOptions(targets);
    await MidiQOL.completeItemUse(feature, config, options);
}