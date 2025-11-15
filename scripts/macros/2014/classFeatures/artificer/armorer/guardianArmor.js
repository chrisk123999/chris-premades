import {activityUtils, actorUtils, compendiumUtils, constants, effectUtils, errors, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({workflow}) {
    let guardianEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'guardianArmor');
    if (guardianEffect) return;
    let infiltratorEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'infiltratorArmor');
    if (infiltratorEffect) {
        let infuseItem = itemUtils.getItemByIdentifier(workflow.actor, 'infuseItem');
        let {enhancedWeapon, radiantWeapon} = infuseItem?.flags['chris-premades']?.infusions ?? {};
        if (enhancedWeapon || radiantWeapon) {
            let launcher = itemUtils.getItemByIdentifier(workflow.actor, 'lightningLauncher');
            if (launcher && [enhancedWeapon, radiantWeapon].includes(launcher.uuid)) {
                let actual = 'enhancedWeapon';
                if (radiantWeapon === launcher.uuid) actual = 'radiantWeapon';
                await genericUtils.setFlag(infuseItem, 'chris-premades', 'infusions.-=' + actual, null);
            }
        }
        await genericUtils.remove(infiltratorEffect);
    }
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'defensiveField', {strict: true});
    if (!feature) return;
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Guardian Armor: Thunder Gauntlets', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.GuardianArmor.ThunderGauntlets', identifier: 'thunderGauntlets'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {
        identifier: 'guardianArmor', 
        vae: [
            {type: 'use', name: featureData.name, identifier: 'guardianArmor', activityIdentifier: 'defensiveField'}, 
            {type: 'use', name: featureData.name, identifier: 'thunderGauntlets'}
        ],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['defensiveField'],
            favorite: true
        }
    });
    if (!effect) return;
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: true, parentEntity: effect});
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
async function attack({workflow}) {
    if (workflow.targets.size !== 1 || workflow.disadvantage) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'thunderGauntletsDistracted');
    let originItem = await effectUtils.getOriginItem(effect);
    let originActor = originItem?.actor;
    if (originActor === workflow.targets.first().actor) return;
    workflow.disadvantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Disadvantage') + ': ' + effect.name);
}
async function early({trigger, workflow}) {
    let ability = actorUtils.getBestAbility(workflow.actor, ['str', 'int']);
    if (ability === 'str') return;
    let activity = workflow.activity.clone({'attack.ability': ability}, {keepId: true});
    workflow.activity = activity;
}
export let guardianArmor = {
    name: 'Arcane Armor: Guardian Model',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['guardianArmor']
            }
        ]
    },
    ddbi: {
        additionalItems: {
            'Arcane Armor': [
                'Arcane Armor: Guardian Model',
                'Arcane Armor: Infiltrator Model'
            ]
        },
        removedItems: {
            'Arcane Armor': [
                'Guardian Armor: Thunder Gauntlets',
                'Guardian Armor: Thunder Gauntlets (STR)',
                'Guardian Armor: Defensive Field',
                'Infiltrator Armor: Lightning Launcher',
                'Infiltrator Armor: Lightning Launcher (DEX)'
            ]
        }
    }
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
            },
            {
                pass: 'preambleComplete',
                macro: early,
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