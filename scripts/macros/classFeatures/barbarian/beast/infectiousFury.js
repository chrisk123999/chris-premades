import {constants} from '../../../../constants.js';
import {chris} from '../../../../helperFunctions.js';
import {translate} from '../../../../translations.js';
import {queue} from '../../../../utility/queue.js';
async function attack({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (!chris.findEffect(workflow.actor, 'Rage')) return;
    let naturalWeapon = workflow.item.flags['chris-premades']?.feature?.formOfTheBeast?.natural;
    if (!naturalWeapon) return;
    let feature = chris.getItem(workflow.actor, 'Infectious Fury');
    if (!feature) return;
    if (!feature.system.uses.value) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'formOfTheBeast', 450);
    if (!queueSetup) return;
    let selection = await chris.dialog(feature.name, constants.yesNo, 'Use ' + feature.name + '?');
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    await feature.update({'system.uses.value': feature.system.uses.value - 1});
    let [config, options] = constants.syntheticItemWorkflowOptions([workflow.targets.first().document.uuid]);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    queue.remove(workflow.item.uuid);
}
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.failedSaves.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'infectiousFuryItem', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog(workflow.item.name, [['Attack a Nearby Target', false], ['Take Damage', 'damage']], 'How do you curse your target?') ?? 'damage';
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageRoll = await new Roll('2d12[' + translate.damageType('psychic') + ']').roll({async: true});
    await chris.applyWorkflowDamage(workflow.token, damageRoll, 'psychic', [workflow.targets.first()], workflow.item.name, workflow.itemCardId);
    queue.remove(workflow.item.uuid);
}
export let infectiousFury = {
    'attack': attack,
    'item': item
}