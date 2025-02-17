import {effectUtils, genericUtils, rollUtils} from '../../../../../utils.js';

async function use({workflow}) {
    if (workflow.targets.size !== 1) return;
    let targetToken = workflow.targets.first();
    if (effectUtils.getEffectByStatusID(targetToken.actor, 'incapacitated')) return;
    let result = await rollUtils.contestedRoll({
        sourceToken: workflow.token,
        targetToken,
        sourceRollType: 'skill',
        targetRollType: 'skill',
        sourceAbilities: ['ins'],
        targetAbilities: ['dec']
    });
    if (result <= 0) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60
        },
        flags: {
            'chris-premades': {
                insightfulFighting: {
                    target: targetToken.document.uuid
                }
            }
        }
    };
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'insightfulFighting');
    if (effect) await genericUtils.remove(effect);
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'insightfulFighting'});
}
export let insightfulFighting ={
    name: 'Insightful Fighting',
    version: '1.1.0',
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