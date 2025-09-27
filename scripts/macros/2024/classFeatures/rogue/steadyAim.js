import {combatUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function move({trigger: {entity: item, token}}) {
    if (!combatUtils.inCombat()) return;
    if (!combatUtils.isOwnTurn(token) || !item.system.uses.value) return;
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
}
async function use({trigger, workflow}) {
    let infiltrationExpertise = itemUtils.getItemByIdentifier(workflow.actor, 'infiltrationExpertise');
    if (infiltrationExpertise) return;
    let sourceEffect = itemUtils.getEffectByIdentifier(workflow.item, 'steadyAimMovement');
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    await effectUtils.createEffect(workflow.actor, effectData);
}
export let steadyAim = {
    name: 'Steady Aim',
    version: '1.3.77',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    movement: [
        {
            pass: 'moved',
            macro: move,
            priority: 50
        }
    ]
};