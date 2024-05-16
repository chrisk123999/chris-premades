import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
export async function hailOfThorns({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    if (workflow.item?.system?.actionType != 'rwak') return;
    let effect = chris.findEffect(workflow.actor, 'Hail of Thorns');
    if (!effect) return;
    let featureData = await chris.getItemFromCompendium('chris-premades.CPR Spell Features', 'Hail of Thorns - Burst', false);
    if (!featureData) return;
    featureData.system.description.value = chris.getItemDescription('CPR - Descriptions', 'Hail of Thorns - Burst');
    let damageDice = Math.min(effect.flags['midi-qol'].castData.castLevel, 6);
    featureData.system.damage.parts = [
        [
            damageDice + 'd10[piercing]',
            'piercing'
        ]
    ];
    let concEffect = await fromUuid(effect.origin);
    if (!concEffect) return;
    let originItem = await fromUuid(concEffect.origin);
    if (!originItem) return;
    featureData.system.save.dc = chris.getSpellDC(originItem);
    setProperty(featureData, 'chris-premades.spell.castData.school', originItem.system.school);
    let feature = new CONFIG.Item.documentClass(featureData, {'parent': workflow.actor});
    let targetToken = workflow.targets.first();
    let targetUuids = await chris.findNearby(targetToken, 5).concat(targetToken).map(t => t.document.uuid);
    let [config, options] = constants.syntheticItemWorkflowOptions(targetUuids);
    await warpgate.wait(100);
    await MidiQOL.completeItemUse(feature, config, options);
    await chris.removeEffect(concEffect);
}