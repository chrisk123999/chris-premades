import {actorUtils, applications, automationUtils, dialogUtils, genericUtils, rollUtils, workflowUtils} from '../../../proxy.mjs';
async function doFall({workflow}) {
    const rollDC = automationUtils.getConfigValue(workflow.item, 'rollDC');
    const selection = await applications.DialogApp.dialog(workflow.item.name, '', [
        ['number', [
            {name: 'distance', label: _loc('CHRISPREMADES.Config.Distance')}
        ]],
        ['selectOption', [
            {
                name: 'type',
                label: _loc('CHRISPREMADES.Macros.All.Fall.Type'),
                options: {
                    options: [
                        {value: 'ground', label: _loc('CHRISPREMADES.Macros.All.Fall.Ground')},
                        {value: 'water', label: _loc('CHRISPREMADES.Macros.All.Fall.Water')},
                        {value: 'creature', label: _loc('CHRISPREMADES.Macros.All.Fall.Creature')}
                    ]
                }
            }
        ]]
    ], 'okCancel');
    if (!selection?.buttons) return;
    let formula = dnd5e.rules.getFallDamageFormula(selection.distance, canvas.grid.units);
    if (!formula) return;
    let otherTarget = false;
    const target = game.user.targets.first()?.document;
    switch(selection.type) {
        case 'water': {
            if (actorUtils.hasUsedReaction(workflow.actor)) break;
            const reaction = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.Fall.Reaction', [
                ['CHRISPREMADES.Macros.All.Fall.Acr', 'acr'],
                ['CHRISPREMADES.Macros.All.Fall.Ath', 'ath'],
                ['COMMON.No', false]
            ], {displayAsRows: true});
            if (!reaction) break;
            const check = await rollUtils.requestRoll(workflow.actor, 'skill', reaction, {rollDC});
            if (check?.isSuccess) formula = 'floor(' + formula + ' / 2)';
            await actorUtils.setReactionUsed(workflow.actor);
            break;
        }
        case 'creature': {
            const targetSize = actorUtils.getSize(target.actor);
            const sourceSize = actorUtils.getSize(workflow.actor);
            if (sourceSize === 0 || targetSize === 0) {
                genericUtils.notify('CHRISPREMADES.Macros.All.Fall.Tiny');
                await ground(workflow.actor);
                break;
            }
            let save = await rollUtils.requestRoll(target.actor, 'save', 'dex', {rollDC});
            if (save?.isSuccess) break;
            formula = 'floor(' + formula + ' / 2)';
            otherTarget = true;
            if (targetSize - sourceSize >= 2) break;
            await ground(target.actor);
            break;
        }
    }
    await ground(workflow.actor);
    await workflow.setDamageRolls([await rollUtils.damageRoll(formula, workflow.activity, {type: CONFIG.DND5E.falling.damageType})]);
    if (otherTarget) await workflowUtils.applyDamage([target], workflow.damageTotal, 'bludgeoning');
}
async function ground(actor) {
    await actorUtils.applyConditions(actor, ['prone']);
}
export const fall =  {
    name: 'Fall',
    version: '2.0.4',
    rules: 'all',
    roll: [
        {
            pass: 'activityDamageRoll',
            macro: doFall,
            priority: 50
        }
    ],
    config: {
        rollDC: {
            default: 15,
            type: 'number',
            label: 'CHRISPREMADES.Config.DC',
            category: 'behavior'
        }
    }
};
