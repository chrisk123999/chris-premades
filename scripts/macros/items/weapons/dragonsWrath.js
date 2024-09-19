import {compendiumUtils, constants, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (workflow.d20AttackRoll !== 20) return;
    let targetToken = workflow.hitTargets.first();
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.itemFeatures, 'Dragon\'s Wrath: Critical Burst', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.DragonsWrath.Burst'});
    if (!featureData) return;
    let damageType = workflow.item.system.damage.parts[1]?.[1] ?? 'cold';
    featureData.system.damage.parts[0][1] = damageType;
    let nearbyTargets = await tokenUtils.findNearby(targetToken, 5, 'ally');
    if (!nearbyTargets.length) return;
    await workflowUtils.syntheticItemDataRoll(featureData, workflow.actor, nearbyTargets);
}
async function early({workflow}) {
    let originId = workflow.item.flags['chris-premades']?.equipment?.parent?.id;
    if (!originId) return;
    let originItem = workflow.actor.items.get(originId);
    if (!originItem) return;
    let damageAmount = workflow.item.system.damage.parts[0][0];
    let damageType = originItem.system.damage.parts[1][1];
    workflow.item = workflow.item.clone({'system.damage.parts': [[damageAmount, damageType]]}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
export let dragonsWrath = {
    name: 'Dragon\'s Wrath',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    }
};
export let dragonsWrathBreath = {
    name: 'Dragon\'s Wrath: Breath',
    version: dragonsWrath.version,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};
export let dragonsWrath0 = {
    name: 'Dragon\'s Wrath Weapon (Slumbering)',
    version: '0.12.70'
};
export let dragonsWrath1 = {
    name: 'Dragon\'s Wrath Weapon (Stirring)',
    version: '0.12.70'
};
export let dragonsWrath2 = {
    name: 'Dragon\'s Wrath Weapon (Wakened)',
    version: '0.12.70',
    equipment: {
        dragonsWrathWakenedBreath: {
            name: 'Dragon\'s Wrath: Wakened Breath',
            compendium: 'itemEquipment',
            useJournal: true,
            translate: 'CHRISPREMADES.Macros.DragonsWrath.WakenedBreath'
        }
    }
};
export let dragonsWrath3 = {
    name: 'Dragon\'s Wrath Weapon (Ascendant)',
    version: '0.12.70',
    equipment: {
        dragonsWrathAscendantBreath: {
            name: 'Dragon\'s Wrath: Ascendant Breath',
            compendium: 'itemEquipment',
            useJournal: true,
            translate: 'CHRISPREMADES.Macros.DragonsWrath.AscendantBreath'
        }
    }
};