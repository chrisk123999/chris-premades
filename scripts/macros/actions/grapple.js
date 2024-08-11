import {actorUtils, dialogUtils, effectUtils, genericUtils, socketUtils, tokenUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.token || workflow.targets.size != 1) return;
    if (actorUtils.checkTrait(workflow.targets.first().actor, 'ci', 'grappled')) {
        genericUtils.notify('CHRISPREMADES.Macros.Grapple.Immune', 'info');
        return;
    }
    if (actorUtils.getSize(workflow.targets.first().actor) > (actorUtils.getSize(workflow.actor) + 1)) {
        genericUtils.notify('CHRISPREMADES.Macros.Grapple.Size', 'info');
        return;
    }
    let inputs = [[CONFIG.DND5E.skills.ath.label, 'ath'], [CONFIG.DND5E.skills.acr.label, 'acr']];
    let targetUser = socketUtils.firstOwner(workflow.targets.first());
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Grapple.ChooseSkill', inputs, {displayAsRows: true, userId: targetUser.id});
    if (!selection) return;
    let result = await tokenUtils.contestedCheck(workflow.token, workflow.targets.first(), 'ath', selection);
    if (!result) return;
    //Rideable integration here!
    await effectUtils.applyConditions(workflow.targets.first().actor, ['grappled']);
}
export let grapple = {
    name: 'Grapple',
    version: '0.12.12',
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