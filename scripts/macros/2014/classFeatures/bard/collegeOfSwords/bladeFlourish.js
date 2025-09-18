import {activityUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (['boomingBlade', 'greenFlameBlade'].includes(genericUtils.getIdentifier(workflow.item))) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!combatUtils.perTurnCheck(item, 'bladeFlourishMovement', true, workflow.token.id)) return;
    let movementFeature = activityUtils.getActivityByIdentifier(item, 'bladeFlourishMovement', {strict: true});
    if (!movementFeature) return;
    if (combatUtils.inCombat() && combatUtils.perTurnCheck(item, 'bladeFlourishMovement', true, workflow.token.id)) await workflowUtils.syntheticActivityRoll(movementFeature, [workflow.token]);
    await combatUtils.setTurnCheck(item, 'bladeFlourishMovement');
}
async function damage({trigger: {entity: item}, workflow}) {
    if (['boomingBlade', 'greenFlameBlade'].includes(genericUtils.getIdentifier(workflow.item))) return;
    if (!workflowUtils.isAttackType(workflow, 'weaponAttack')) return;
    if (!combatUtils.perTurnCheck(item, 'bladeFlourish', true, workflow.token.id)) return;
    if (workflow.hitTargets.size !== 1) return;
    let defensiveFeature = activityUtils.getActivityByIdentifier(item, 'defensiveFlourish', {strict: true});
    let mobileFeature = activityUtils.getActivityByIdentifier(item, 'mobileFlourish', {strict: true});
    let slashingFeature = activityUtils.getActivityByIdentifier(item, 'slashingFlourish', {strict: true});
    if (!defensiveFeature || !mobileFeature || !slashingFeature) return;
    let bardic = itemUtils.getItemByIdentifier(workflow.actor, 'bardicInspiration');
    if (!bardic) return;
    let uses = bardic.system.uses.value;
    let mastersFlourish = itemUtils.getItemByIdentifier(workflow.actor, 'mastersFlourish');
    if (!mastersFlourish && !uses) return;
    let buttons = [
        [defensiveFeature.name, 'DF', {image: defensiveFeature.img}],
        [mobileFeature.name, 'MF', {image: mobileFeature.img}],
        [slashingFeature.name, 'SF', {image: slashingFeature.img}],
        ['CHRISPREMADES.Generic.No', false]
    ];
    let selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.BladeFlourish.Select', buttons);
    if (!selection) return;
    let skipUses = false;
    if (mastersFlourish) skipUses = uses ? await dialogUtils.confirm(mastersFlourish.name, 'CHRISPREMADES.Macros.BladeFlourish.Master') : true;
    await combatUtils.setTurnCheck(item, 'bladeFlourish');
    if (!skipUses) genericUtils.update(bardic, {'system.uses.spent': bardic.system.uses.spent + 1});
    let bardicDie = workflow.actor.system.scale.bard?.['inspiration'];
    if (skipUses) bardicDie = {'formula': '1d6'};
    if (!bardicDie) return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, bardicDie.formula, {damageType});
    let rollResult = workflow.damageRolls.at(-1).total;
    switch (selection) {
        case 'DF':
            await genericUtils.update(item.effects.get(defensiveFeature.effects[0]._id), {'changes': [{
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: rollResult,
                priority: 20
            }]});
            await workflowUtils.syntheticActivityRoll(defensiveFeature, [workflow.token]);
            break;
        case 'MF':
            await genericUtils.setFlag(item, 'chris-premades', 'mobileFlourish.roll', rollResult);
            await workflowUtils.syntheticActivityRoll(mobileFeature, [workflow.hitTargets.first()]);
            break;
        case 'SF': {
            let activityData = activityUtils.withChangedDamage(slashingFeature, rollResult, [damageType]);
            let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => i.document.uuid !== workflow.hitTargets.first().document.uuid);
            if (nearbyTargets.length) await workflowUtils.syntheticActivityDataRoll(activityData, item, item.actor, nearbyTargets);
            break;
        }
    }
}
async function mobilePush({workflow}) {
    let bardicResult = workflow.item.flags['chris-premades'].mobileFlourish.roll;
    let distance = Math.floor((5 + bardicResult) / 5) * 5;
    let push = await dialogUtils.confirm(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.BladeFlourish.Push', {distance}));
    if (push) await tokenUtils.pushToken(workflow.token, workflow.targets.first(), distance);
}
export let bladeFlourish = {
    name: 'Blade Flourish',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: mobilePush,
                priority: 50,
                activities: ['mobileFlourish']
            }
        ],
        actor: [
            {
                pass: 'attackRollComplete',
                macro: attack,
                priority: 50
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};