import {itemUtils} from '../../../../utils.js';

async function late({workflow}) {
    if (!workflow.hitTargets.size || !workflow.damageList) return;
    if (!workflow.damageList.some(i => i.oldHP > 0 && i.newHP === 0)) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'darkOnesBlessing');
    if (!feature) return;
    await feature.use();
}
export let darkOnesBlessing = {
    name: 'Dark One\'s Blessing',
    version: '0.12.55',
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};