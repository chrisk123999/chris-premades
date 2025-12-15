import {Teleport} from '../../../../lib/teleport.js';
import {activityUtils, actorUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    let identifier = genericUtils.getIdentifier(item);
    let bonusFormula = '1';
    if (identifier === 'wrapsOfDyamak1') bonusFormula = '2';
    if (identifier === 'wrapsOfDyamak2') bonusFormula = '3';
    if (workflow.isCritical) {
        let crimson = activityUtils.getActivityByIdentifier(item, 'crimsonMist');
        let ravenous = activityUtils.getActivityByIdentifier(item, 'ravenousStrike');
        if (crimson) await genericUtils.update(crimson, {'uses.spent': 0});
        if (ravenous) await genericUtils.update(ravenous, {'uses.spent': 0});
    }
    await workflowUtils.bonusAttack(workflow, bonusFormula);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    let identifier = genericUtils.getIdentifier(item);
    let bonusFormula = '1';
    if (identifier === 'wrapsOfDyamak1') bonusFormula = '2';
    if (identifier === 'wrapsOfDyamak2') {
        bonusFormula = '3';
        let ravenousActivity = activityUtils.getActivityByIdentifier(item, 'ravenousStrike', {strict: true});
        if (ravenousActivity.uses.value) {
            let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: ravenousActivity.name}));
            if (selection) {
                await workflowUtils.bonusDamage(workflow, '6d6[necrotic]', {damageType: 'necrotic'});
                genericUtils.setProperty(workflow, 'chrisPremades.strikeUsed', true);
                await workflowUtils.syntheticActivityRoll(ravenousActivity, [workflow.targets.first()], {config: {consumeUsage: true, consume: {resources: true}}, options: {configureDialog: false}});
            }
        }
    }
    await workflowUtils.bonusDamage(workflow, bonusFormula, {damageType: workflow.defaultDamageType});
}
async function late({workflow}) {
    if (!workflow.chrisPremades?.strikeUsed) return;
    let necroticDealt = workflow.damageItem.damageDetail.filter(i => i.type === 'necrotic').reduce((acc, i) => acc + i.value, 0);
    if (!necroticDealt) return;
    await workflowUtils.applyDamage([workflow.token], necroticDealt, 'healing');
}
async function rest({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    let ki = itemUtils.getItemByIdentifier(actor, 'ki');
    if (!ki) return;
    let feature = await activityUtils.getActivityByIdentifier(item, 'wrapsOfDyamakHeal', {strict: true});
    if (!feature) return;
    let activityData = activityUtils.withChangedDamage(feature, ki.system.uses.max);
    await workflowUtils.syntheticActivityDataRoll(activityData, item, item.actor);
}
async function useMist({workflow}) {
    let playAnimation = itemUtils.getConfig(workflow.item, 'playAnimation');
    await Teleport.target(workflow.token, workflow.token, {
        animation: playAnimation ? 'crimsonMist' : 'none',
        range: 30
    });
}
export let wrapsOfDyamak = {
    name: 'Wraps of Dyamak',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attack,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ]
};
export let wrapsOfDyamak0 = {
    name: 'Wraps of Dyamak (Dormant)',
    version: '1.1.0'
};
export let wrapsOfDyamak1 = {
    name: 'Wraps of Dyamak (Awakened)',
    version: '1.1.0'
};
export let wrapsOfDyamak2 = {
    name: 'Wraps of Dyamak (Exalted)',
    version: '1.1.0'
};
export let crimsonMist = {
    name: 'Crimson Mist',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useMist,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};