import {actorUtils, dialogUtils, effectUtils, genericUtils, rollUtils, socketUtils, tokenUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    if (workflow.targets.size != 1) return;
    let skipCheck = false;
    let targetToken = workflow.targets.first();
    if (workflow.actor.uuid === targetToken.actor.uuid) return;
    if ((actorUtils.getSize(targetToken.actor)) > (actorUtils.getSize(workflow.actor) + 1)) {
        genericUtils.notify('CHRISPREMADES.Macros.Shove.Big', 'info');
    }
    if (effectUtils.getEffectByIdentifier(targetToken.actor, 'incapacitated')) skipCheck = true;
    if (!skipCheck) {
        let inputs = [[CONFIG.DND5E.skills.ath.label, 'ath'], [CONFIG.DND5E.skills.acr.label, 'acr'], ['CHRISPREMADES.Generic.Uncontested', 'skip']];
        let targetUser = socketUtils.firstOwner(targetToken);
        let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Shove.ChooseSkill', inputs, {displayAsRows: true, userId: targetUser.id});
        if (!selection) return;
        if (selection != 'skip') {
            let result = await rollUtils.contestedRoll(workflow.token, targetToken, 'skill', 'skill', ['ath'], [selection]);
            if (result <= 0) return;
        }
    }
    let selection = 'move';
    if (!effectUtils.getEffectByStatusID(targetToken.actor, 'prone')) {
        let inputs = [['CHRISPREMADES.Macros.Shove.Shove', 'move'], ['CHRISPREMADES.Macros.Shove.KnockProne', 'prone']];
        selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Shove.MoveOrProne', inputs, {displayAsRows: true});
        if (!selection) return;
    }
    if (selection === 'prone') {
        if (actorUtils.checkTrait(targetToken.actor, 'ci', 'prone')) return;
        await effectUtils.applyConditions(targetToken.actor, ['prone']);
        return;
    }
    await tokenUtils.pushToken(workflow.token, targetToken, 5);
}
export let shove = {
    name: 'Shove',
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