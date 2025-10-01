import {activityUtils, combatUtils, constants, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';
async function turnStart({trigger: {entity: item}}) {
    if (game.combat.round !== 1) return;
    await workflowUtils.completeItemUse(item);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!item.system.uses.value) return;
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!combatUtils.perTurnCheck(item, 'dreadAmbusher', false, workflow.token.id)) return;
    let selection = await dialogUtils.confirmUseItem(item);
    if (!selection) return;
    await genericUtils.update(item, {'system.uses.spent': item.system.uses.spent + 1});
    let stalkersFlurry = itemUtils.getItemByIdentifier(workflow.actor, 'stalkersFlurry');
    let damageFormulaItem = stalkersFlurry ? stalkersFlurry : item;
    let formula = itemUtils.getConfig(damageFormulaItem, 'formula');
    let damageType = itemUtils.getConfig(damageFormulaItem, 'damageType');
    await workflowUtils.bonusDamage(workflow, formula, {damageType});
    genericUtils.setProperty(workflow, 'chris-premades.dreadAmbusher', true);
    await combatUtils.setTurnCheck(item, 'dreadAmbusher');
}
async function late({workflow}) {
    if (!workflow['chris-premades']?.dreadAmbusher) return;
    let stalkersFlurry = itemUtils.getItemByIdentifier(workflow.actor, 'stalkersFlurry');
    if (!stalkersFlurry) return;
    let input = {
        label: 'CHRISPREMADES.Generic.Select',
        name: 'stalkersFlurryOption',
        options: {
            options: [
                {value: 'suddenStrike', label: 'CHRISPREMADES.Macros.StalkersFlurry.SuddenStrike'},
                {value: 'massFear', label: 'CHRISPREMADES.Macros.StalkersFlurry.MassFear'},
            ]
        }
    };
    let selection = await dialogUtils.selectDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.StalkersFlurry.Use', {item: stalkersFlurry.name}), input);
    if (selection === 'suddenStrike') {
        let target = workflow.hitTargets.first();
        let targetNearbyAllies = tokenUtils.findNearby(target, 5, 'ally');
        let nearbyTargets = tokenUtils.findNearby(workflow.token, workflow.rangeDetails.range, 'enemy').filter(i => i != target && targetNearbyAllies.includes(i));
        if (!nearbyTargets.length) return;
        let selection = await dialogUtils.selectTargetDialog('CHRISPREMADES.Macros.StalkersFlurry.SuddenStrike', 'CHRISPREMADES.Generic.Target', nearbyTargets, {skipDeadAndUnconscious: false, buttons: 'yesNo'});
        if (!selection?.length) return;
        selection = selection[0];
        await workflowUtils.syntheticItemRoll(workflow.item, [selection]);
    }
    else if (selection === 'massFear') {
        let massFear = activityUtils.getActivityByIdentifier(stalkersFlurry, 'stalkersFlurryMassFear');
        if (!massFear) return;
        let range = itemUtils.getConfig(stalkersFlurry, 'range');
        let targets = tokenUtils.findNearby(workflow.targets.first(), range, null, {includeToken: true}).filter(i => itemUtils.getConfig(stalkersFlurry, 'includeSelf') || i.actor !== workflow.actor);
        await workflowUtils.syntheticActivityRoll(massFear, targets);
    }
}
export let dreadAmbusher = {
    name: 'Dread Ambusher',
    version: '1.3.81',
    rules: 'modern',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 250
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: [
        {
            value: 'formula',
            label: 'CHRISPREMADES.Config.Formula',
            type: 'text',
            default: '2d6',
            homebrew: true,
            category: 'homebrew'
        },
        {
            value: 'damageType',
            label: 'CHRISPREMADES.Config.DamageType',
            type: 'select',
            default: 'psychic',
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        },
    ]
};