import {effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    let target = workflow.targets.first()?.actor ?? workflow.actor;
    let targetUuid = workflow.item.flags['chris-premades']?.blessingOfTheTrickster?.targetUuid;
    let effect;
    if (targetUuid) effect = await fromUuid(targetUuid);
    if (effect) await genericUtils.remove(effect);
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.duration = itemUtils.convertDuration(workflow.activity);
    let targetEffect = await effectUtils.createEffect(target, effectData);
    genericUtils.setFlag(workflow.item, 'chris-premades', 'blessingOfTheTrickster.targetUuid', targetEffect.uuid);
}
export let blessingOfTheTrickster = {
    name: 'Blessing of the Trickster',
    version: '1.3.13',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};