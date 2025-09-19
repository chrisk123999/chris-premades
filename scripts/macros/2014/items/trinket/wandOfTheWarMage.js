import {constants, tokenUtils, workflowUtils} from '../../../../utils.js';
async function early({workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'spellAttack')) return;
    let targetToken = workflow.targets.first();
    if (!targetToken) return;
    let coverBonus = tokenUtils.checkCover(workflow.token, targetToken, {item: workflow.item});
    if (coverBonus != 2) return;
    await workflowUtils.bonusAttack(workflow, '2');
}
export let wandOfTheWarMage = {
    name: 'Wand of the War Mage',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: early,
                priority: 60
            }
        ]
    }
};
let version = '1.1.0';
export let wandOfTheWarMage1 = {
    name: 'Wand of the War Mage, +1',
    version
};
export let wandOfTheWarMage2 = {
    name: 'Wand of the War Mage, +2',
    version
};
export let wandOfTheWarMage3 = {
    name: 'Wand of the War Mage, +3',
    version
};