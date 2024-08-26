import {combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function attack({workflow}) {
    if (['boomingBlade', 'greenFlameBlade'].includes(genericUtils.getIdentifier(workflow.item))) return;
    if (!constants.weaponAttacks.includes(workflow.item.system.actionType)) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'bladeFlourish');
    if (!feature || !combatUtils.perTurnCheck(feature, 'bladeFlourish', true, workflow.token.id)) return;
    let movementData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Blade Flourish: Movement', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BladeFlourish.Movement'});
    if (!movementData) {
        errors.missingPackItem();
        return;
    }
    if (combatUtils.inCombat() && combatUtils.perTurnCheck(feature, 'bladeFlourishMovement', true, workflow.token.id)) await workflowUtils.syntheticItemDataRoll(movementData, workflow.actor, [workflow.token]);
    await combatUtils.setTurnCheck(feature, 'bladeFlourishMovement');
    if (workflow.hitTargets.size !== 1) return;
    let defensiveData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Defensive Flourish', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BladeFlourish.Defensive'});
    let mobileData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Mobile Flourish', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BladeFlourish.Mobile'});
    let slashingData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Slashing Flourish', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.BladeFlourish.Slashing'});
    let bardic = itemUtils.getItemByIdentifier(workflow.actor, 'bardicInspiration');
    if (!bardic) return;
    let uses = bardic.system.uses.value;
    let mastersFlourish = itemUtils.getItemByIdentifier(workflow.actor, 'mastersFlourish');
    if (!mastersFlourish && !uses) return;
    if (!defensiveData || !mobileData || !slashingData) {
        errors.missingPackItem();
        return;
    }
    let buttons = [
        [defensiveData.name, 'DF', {image: defensiveData.img}],
        [mobileData.name, 'MF', {image: mobileData.img}],
        [slashingData.name, 'SF', {image: slashingData.img}],
        ['CHRISPREMADES.Generic.No', false]
    ];
    let selection = await dialogUtils.buttonDialog(feature.name, 'CHRISPREMADES.Macros.BladeFlourish.Select', buttons);
    if (!selection) return;
    let skipUses = uses ? await dialogUtils.confirm(mastersFlourish.name, 'CHRISPREMADES.Macros.BladeFlourish.Master') : true;
    await combatUtils.setTurnCheck(feature, 'bladeFlourish');
    if (!skipUses) genericUtils.update(bardic, {'system.uses.value': uses - 1});
    let bardicDie = workflow.actor.system.scale.bard?.['bardic-inspiration'];
    if (skipUses) bardicDie = {'formula': '1d6'};
    if (!bardicDie) return;
    let damageType = workflow.defaultDamageType;
    await workflowUtils.bonusDamage(workflow, bardicDie, {damageType});
    let rollResult = workflow.damageRolls.at(-1).total;
    switch (selection) {
        case 'DF': 
            defensiveData.effects[0].changes[0].value = rollResult;
            await workflowUtils.syntheticItemDataRoll(defensiveData, workflow.actor, [workflow.token]);
            break;
        case 'MF':
            genericUtils.setProperty(mobileData, 'flags.chris-premades.mobileFlourish.roll', rollResult);
            await workflowUtils.syntheticItemDataRoll(mobileData, workflow.actor, [workflow.hitTargets.first()]);
            break;
        case 'SF': {
            slashingData.system.damage.parts = [
                [rollResult + '[' + damageType + ']', damageType]
            ];
            let nearbyTargets = tokenUtils.findNearby(workflow.token, 5, 'enemy').filter(i => i.document.uuid !== workflow.hitTargets.first().document.uuid);
            if (nearbyTargets.length) await workflowUtils.syntheticItemDataRoll(slashingData, workflow.actor, nearbyTargets);
            break;
        }
    }
}
async function mobilePush({workflow}) {
    let bardicResult = workflow.item.flags['chris-premades'].mobileFlourish.roll;
    let distance = Math.floor((5 + bardicResult) / 5) * 5;
    let push = await dialogUtils.confirm(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.BladeFlourish.Push', {distance}));
    if (push) await tokenUtils.pushToken(workflow.token, workflow.targets.first());
}
export let bladeFlourish = {
    name: 'Blade Flourish',
    version: '0.12.37',
    midi: {
        item: [
            {
                pass: 'postDamageRoll',
                macro: attack,
                priority: 50
            }
        ]
    }
};
export let bladeFlourishMobile = {
    name: 'Blade Flourish: Mobile Flourish',
    version: bladeFlourish.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: mobilePush,
                priority: 50
            }
        ]
    }
};