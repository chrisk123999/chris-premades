import {compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let guardianEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'guardianArmor');
    if (guardianEffect) return;
    let infiltratorEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'infiltratorArmor');
    if (infiltratorEffect) await genericUtils.remove(infiltratorEffect);
    let fieldUses = workflow.actor.flags['chris-premades']?.defensiveField?.uses ?? workflow.actor.system.attributes.prof;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Guardian Armor: Defensive Field', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.GuardianArmor.DefensiveField', identifier: 'defensiveField'});
    let featureData2 = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Guardian Armor: Thunder Gauntlets', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.GuardianArmor.ThunderGauntlets', identifier: 'thunderGauntlets'});
    if (!featureData || !featureData2) {
        errors.missingPackItem();
        return;
    }
    featureData.system.uses.value = fieldUses;
    featureData.system.uses.max = workflow.actor.system.attributes.prof;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'guardianArmor', vae: [{type: 'use', name: featureData.name, identifier: 'defensiveField'}, {type: 'use', name: featureData2.name, identifier: 'thunderGauntlets'}]});
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData, featureData2], {favorite: true, parentEntity: effect});
}
async function late({workflow}) {
    if (!workflow.hitTargets.size) return;
    let target = workflow.targets.first();
    if (!target?.actor) return;
    let effectData = {
        name: genericUtils.translate('CHRISPREMADES.Macros.GuardianArmor.Distracted'),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                showIcon: true,
                specialDuration: [
                    'turnStartSource'
                ]
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['guardianArmorThunderGauntlets']);
    await effectUtils.createEffect(target.actor, effectData, {identifier: 'thunderGauntletsDistracted'});
}
async function lateDefensive({workflow}) {
    await genericUtils.setFlag(workflow.actor, 'chris-premades', 'defensiveField.uses', workflow.item.system.uses.value);
}
async function attack({workflow}) {
    if (workflow.targets.size !== 1 || workflow.disadvantage) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'thunderGauntletsDistracted');
    let originItem = await fromUuid(effect?.origin);
    let originActor = originItem?.actor;
    if (originActor === workflow.targets.first().actor) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + effect.name);
}
async function longRest({trigger: {entity: item}}) {
    let actor = item.actor;
    if (!actor) return;
    await genericUtils.setFlag(actor, 'chris-premades', 'defensiveField.uses', actor.system.attributes.prof);
}
export let guardianArmor = {
    name: 'Arcane Armor: Guardian Model',
    version: '0.12.28',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: longRest,
            priority: 50
        }
    ]
};
export let guardianArmorThunderGauntlets = {
    // Note: intentionally different from actual name. Don't want the medkit to light up for a feature item
    name: 'Arcane Armor: Thunder Gauntlets',
    version: guardianArmor.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: attack,
                priority: 50
            }
        ]
    }
};
export let guardianArmorDefensiveField = {
    name: 'Arcane Armor: Defensive Field',
    version: guardianArmor.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: lateDefensive,
                priority: 50
            }
        ]
    }
};