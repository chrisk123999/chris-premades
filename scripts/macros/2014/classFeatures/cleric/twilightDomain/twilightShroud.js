import {constants, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function attack({trigger: {token}, workflow}) {
    if (workflow.targets.size !== 1 || !workflow.item || !constants.attacks.includes(workflow.activity.actionType)) return;
    let targetToken = workflow.targets.first();
    if (targetToken.document.disposition !== token.document.disposition) return;
    let coverBonus = tokenUtils.checkCover(workflow.token, targetToken, {item: workflow.item});
    if (coverBonus >= 2) return;
    let feature = itemUtils.getItemByIdentifier(token.actor, 'twilightShroud');
    if (!feature) return;
    if (tokenUtils.getDistance(token, targetToken) > genericUtils.handleMetric(30)) return;
    await workflowUtils.bonusAttack(workflow, '-2');
    workflow.attackAdvAttribution.add(genericUtils.translate('CHRISPREMADES.Cover.Half') + ': ' + feature.name);
}
export let twilightShroud = {
    name: 'Twilight Shroud',
    version: '1.1.0'
};
export let twilightShroudActive = {
    name: 'Twilight Shroud: Active',
    version: twilightShroud.version,
    midi: {
        actor: [
            {
                pass: 'scenePostAttackRoll',
                macro: attack,
                priority: 50
            }
        ]
    }
};