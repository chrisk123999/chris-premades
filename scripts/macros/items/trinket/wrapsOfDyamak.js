import {Teleport} from '../../../lib/teleport.js';
import {actorUtils, compendiumUtils, constants, dialogUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function attack({trigger: {entity: item}, workflow}) {
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    let identifier = genericUtils.getIdentifier(item);
    let bonusFormula = '1';
    if (identifier === 'wrapsOfDyamak1') bonusFormula = '2';
    if (identifier === 'wrapsOfDyamak2') {
        if (workflow.isCritical && !item.system.uses.value) await genericUtils.update(item, {'system.uses.value': 1}); 
        bonusFormula = '3';
    }
    await workflowUtils.bonusAttack(workflow. bonusFormula);
}
async function damage({trigger: {entity: item}, workflow}) {
    if (!constants.unarmedAttacks.includes(genericUtils.getIdentifier(workflow.item))) return;
    let identifier = genericUtils.getIdentifier(item);
    let bonusFormula = '1';
    if (identifier === 'wrapsOfDyamak1') bonusFormula = '2';
    if (identifier === 'wrapsOfDyamak2') {
        bonusFormula = '3';
        if (item.system.uses.value) {
            let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Use', {itemName: item.name}));
            if (selection) {
                await workflowUtils.bonusDamage(workflow, '6d6[necrotic]', {damageType: 'necrotic'});
                genericUtils.setProperty(workflow, 'chrisPremades.strikeUsed', true);
                await workflowUtils.completeItemUse(item, {consumeUsage: true}, {configureDialog: false});
            }
        }
    }
    await workflowUtils.bonusDamage(workflow. bonusFormula, {damageType: workflow.defaultDamageType});
}
async function late({workflow}){
    if (!workflow.chrisPremades?.strikeUsed) return;
    let necroticDealt = workflow.ditem.damageDetail.filter(i => i.type === 'necrotic').reduce((acc, i) => acc + i.value, 0);
    if (!necroticDealt) return;
    await workflowUtils.applyDamage([workflow.token], necroticDealt, 'healing');
}
async function rest({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    let ki = itemUtils.getItemByIdentifier(actor, 'ki');
    if (!ki) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Wraps of Dyamak: Heal', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.WrapsOfDyamak.Heal'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    featureData.system.damage.parts[0][0] = ki.system.uses.max;
    await workflowUtils.syntheticItemDataRoll(featureData, actor, [actorUtils.getFirstToken(actor)]);
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
    version: '0.12.70',
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
    version: '0.12.70'
};
export let wrapsOfDyamak1 = {
    name: 'Wraps of Dyamak (Awakened)',
    version: '0.12.70',
    equipment: {
        crimsonMist: {
            name: 'Crimson Mist',
            compendium: 'itemEquipment',
            useJournal: true,
            translate: 'CHRISPREMADES.Macros.WrapsOfDyamak.CrimsonMist',
            favorite: true
        }
    }
};
export let wrapsOfDyamak2 = {
    name: 'Wraps of Dyamak (Exalted)',
    version: '0.12.70'
};
export let crimsonMist = {
    name: 'Crimson Mist',
    version: '0.12.70',
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
    ],
};