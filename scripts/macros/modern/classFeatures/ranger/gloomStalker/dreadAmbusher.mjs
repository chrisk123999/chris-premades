import {actorUtils, automationUtils, constants, DamageBonus, dialogUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
async function turnStart({document: item, round}) {
    if (round !== 1) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'dread-ambusher-ambush');
    if (!activity) return;
    await workflowUtils.completeActivityUse(activity, []);
}
async function damage({document: item, workflow, token}) {
    if (!item.system.uses.value) return;
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    const activity = itemUtils.getActivityByIdentifier(item, 'dread-ambusher-strike');
    if (!activity?.uses.value) return;
    const source = actorUtils.getItemByIdentifier(workflow.actor, 'stalkers-flurry') ?? item;
    const bonus = new DamageBonus(item, {formula: automationUtils.getConfigValue(source, 'formula'), maxTargets: 1, type: automationUtils.getConfigValue(source, 'damageType')})
        .withOnUse(async () => {
            await workflowUtils.completeActivityUse(activity, [], {fast: true});
            workflowUtils.setWorkflowProperty(workflow, 'dreadAmbusher.used', true);
        });
    bonus.targets = [workflow.hitTargets.first().document];
    return bonus;
}
async function late({workflow}) {
    if (!workflowUtils.getWorkflowProperty(workflow, 'dreadAmbusher.used')) return;
    const stalkersFlurry = actorUtils.getItemByIdentifier(workflow.actor, 'stalkers-flurry');
    if (!stalkersFlurry) return;
    const selection = await dialogUtils.selectDialog(stalkersFlurry.name, _loc('CHRISPREMADES.Macros.Modern.StalkersFlurry.Use', {item: stalkersFlurry.name}), {
        label: 'CHRISPREMADES.Macros.Modern.StalkersFlurry.Select',
        name: 'stalkersFlurryOption',
        options: {
            options: [
                {value: 'suddenStrike', label: _loc('CHRISPREMADES.Macros.Modern.StalkersFlurry.SuddenStrike')},
                {value: 'massFear', label: _loc('CHRISPREMADES.Macros.Modern.StalkersFlurry.MassFear')}
            ]
        }
    });
    if (selection === 'suddenStrike') await suddenStrike(workflow, stalkersFlurry);
    else if (selection === 'massFear') await massFear(workflow, stalkersFlurry);
}
async function suddenStrike(workflow, stalkersFlurry) {
    const targetToken = workflow.hitTargets.first().document;
    const nearTarget = tokenUtils.findNearby(targetToken, automationUtils.getConfigValue(stalkersFlurry, 'suddenStrikeRange'), {disposition: 'ally'});
    const candidates = tokenUtils.findNearby(workflow.token.document, workflow.rangeDetails.range, {disposition: 'enemy'})
        .filter(candidate => candidate !== targetToken && nearTarget.includes(candidate));
    if (!candidates.length) return genericUtils.notify('CHRISPREMADES.Macros.Modern.StalkersFlurry.NoTargets', {type: 'info'});
    const selection = await dialogUtils.selectTargetDialog(_loc('CHRISPREMADES.Macros.Modern.StalkersFlurry.SuddenStrike'), _loc('DND5E.Target'), candidates, {buttons: 'yesNo'});
    if (!selection?.result) return;
    await workflowUtils.completeItemUse(workflow.item, [selection.result], {fast: true});
}
async function massFear(workflow, stalkersFlurry) {
    const activity = itemUtils.getActivityByIdentifier(stalkersFlurry, 'stalkers-flurry-mass-fear');
    if (!activity) return;
    const range = automationUtils.getConfigValue(stalkersFlurry, 'range');
    const includeSelf = automationUtils.getConfigValue(stalkersFlurry, 'includeSelf');
    const targets = tokenUtils.findNearby(workflow.hitTargets.first().document, range, {includeToken: true})
        .filter(target => includeSelf || target.actor !== workflow.actor);
    if (!targets.length) return genericUtils.notify('CHRISPREMADES.Macros.Modern.StalkersFlurry.NoTargets', {type: 'info'});
    await workflowUtils.completeActivityUse(activity, targets);
}
export const dreadAmbusher = {
    name: 'Dread Ambusher',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: damage,
            priority: 250
        },
        {
            pass: 'actorRollFinished',
            macro: late,
            priority: 50
        }
    ],
    combat: [
        {
            pass: 'actorTurnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    config: {
        formula: {
            default: '2d6',
            type: 'text',
            label: 'CHRISPREMADES.Config.Formula',
            category: 'homebrew'
        },
        damageType: {
            default: 'psychic',
            type: 'select',
            get options() {
                return constants.damageTypeOptions();
            },
            label: 'CHRISPREMADES.Config.DamageType',
            category: 'homebrew'
        }
    }
};
