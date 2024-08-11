import {DialogApp} from '../../applications/dialog.js';
import {actorUtils, dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../utils.js';

async function use({trigger, workflow}) {
    let targetToken = game.user.targets.first();
    let selection = await DialogApp.dialog(workflow.item.name, undefined, [
        [
            'number',
            [
                {
                    label: 'CHRISPREMADES.Macros.Fall.Distance',
                    name: 'distance'
                }
            ]
        ],
        [
            'selectOption',
            [
                {
                    label: 'CHRISPREMADES.Macros.Fall.Type',
                    name: 'type',
                    options: {
                        options: [
                            {
                                value: 'ground',
                                label: 'CHRISPREMADES.Macros.Fall.Ground'
                            },
                            {
                                value: 'water',
                                label: 'CHRISPREMADES.Macros.Fall.Water'
                            },
                            {
                                value: 'creature',
                                label: 'CHRISPREMADES.Macros.Fall.Creature'
                            }
                        ]
                    }
                }
            ]
        ]
    ], 'okCancel');
    if (!selection?.buttons) return;
    let diceNum = Math.min((Math.floor(selection.distance / 10) * 10), 200) / 10;
    if (diceNum === 0) return;
    let damageFormula = diceNum + 'd6';
    async function ground(actor) {
        if (effectUtils.getEffectByStatusID(actor, 'prone') || actorUtils.checkTrait(actor, 'ci', 'prone')) return;
        await effectUtils.applyConditions(actor, ['prone']);
    }
    let otherTarget = false;
    switch(selection.type) {
        case 'water': {
            if (actorUtils.hasUsedReaction(workflow.actor)) break;
            let inputs = [['CHRISPREMADES.Macros.Fall.Acr', 'acr'], ['CHRISPREMADES.Macros.Fall.Ath', 'ath'], ['CHRISPREMADES.Generic.No', false]];
            let reaction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Fall.Reaction', inputs, {displayAsRows: true});
            if (!reaction) break;
            let check = await workflow.actor.rollSkill(reaction, {flavor: CONFIG.DND5E.skills[reaction].label + ' ' + genericUtils.translate('CHRISPREMADES.Macros.Fall.SkillCheck')});
            if (check.total >= 15) damageFormula = 'floor(' + damageFormula + ' / 2)';
            await actorUtils.setReactionUsed(workflow.actor);
            break;
        }
        case 'creature': {
            if (game.user.targets.size != 1) {
                genericUtils.notify('CHRISPREMADES.Macros.Fall.Target', 'info');
                return;
            }
            let targetSize = actorUtils.getSize(targetToken.actor);
            let sourceSize = actorUtils.getSize(workflow.actor);
            if (sourceSize === 0 || targetSize === 0) {
                genericUtils.notify('CHRISPREMADES.Macros.Fall.Tiny');
                await ground(workflow.actor);
                break;
            }
            let save = await targetToken.actor.rollAbilitySave('dex', {flavor: genericUtils.translate('CHRISPREMADES.Macros.Fall.Save'), skipDialog: true});
            if (save.total < 15) {
                damageFormula = 'floor(' + damageFormula + ' / 2)';
                otherTarget = true;
                if (targetSize - sourceSize >= 2) break;
                await ground(targetToken.actor);
            }
            break;
        }
    }
    await ground(workflow.actor);
    await workflowUtils.replaceDamage(workflow, damageFormula, {damageType: 'bludgeoning'});
    if (otherTarget) await workflowUtils.applyDamage([targetToken], workflow.damageTotal, 'bludgeoning');
}
export let fall = {
    name: 'Fall',
    version: '0.12.12',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: use,
                priority: 50
            }
        ]
    }
};