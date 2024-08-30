import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let classLevels = workflow.actor.classes.druid?.system.levels;
    if (!classLevels) return;
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.StarryForm.Select', [
        ['CHRISPREMADES.Macros.StarryForm.Archer', 'Archer'],
        ['CHRISPREMADES.Macros.StarryForm.Dragon', 'Dragon'],
        ['CHRISPREMADES.Macros.StarryForm.Chalice', 'Chalice'],
    ]);
    if (!selection) return;
    let tier = 1;
    if (classLevels > 13) {
        tier = 3;
    } else if (classLevels > 9) {
        tier = 2;
    }
    let featureName;
    switch (selection) {
        case 'Archer':
            featureName = 'Luminous Arrow';
            break;
        case 'Dragon':
            featureName = 'Wise Dragon';
            break;
        case 'Chalice':
            featureName = 'Healing Chalice';
            break;
    }
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Starry Form: ' + featureName, {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.StarryForm.' + selection + 'Feature', identifier: 'starryForm' + selection});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    if (tier > 1) {
        if (selection === 'Dragon') {
            featureData.effects[0].changes.push(
                {
                    key: 'system.attributes.movement.fly',
                    value: 20,
                    mode: 4,
                    priority: 20
                },
                {
                    key: 'system.attributes.movement.hover',
                    value: 1,
                    mode: 0,
                    priority: 20
                }
            );
        } else {
            featureData.system.damage.parts[0][0] = '2' + featureData.system.damage.parts[0][0].slice(1);
        }
    }
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'starryForm');
    let effectData = {
        name: featureData.name,
        img: effect?.img ?? workflow.item.img,
        origin: effect?.origin ?? workflow.item.uuid,
        duration: effect?.duration ?? itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'ATL.light.bright',
                value: 10,
                mode: 4,
                priority: 20
            },
            {
                key: 'ATL.light.dim',
                value: 20,
                mode: 4,
                priority: 20
            },
            {
                key: 'ATL.light.color',
                value: '#ffffff',
                mode: 5,
                priority: 20
            },
            {
                key: 'ATL.light.alpha',
                value: 0.25,
                mode: 5,
                priority: 20
            },
            {
                key: 'ATL.light.animation',
                value: '{type: \'starlight\', speed: 1, intensity: 3}',
                mode: 5,
                priority: 20
            }
        ]
    };
    if (tier === 3) {
        effectData.changes.push(
            {
                key: 'system.traits.dr.value',
                value: 'slashing',
                mode: 2,
                priority: 20
            }, 
            {
                key: 'system.traits.dr.value',
                value: 'piercing',
                mode: 2,
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                value: 'bludgeoning',
                mode: 2,
                priority: 20
            }
        );
    }
    if (tier > 1) effectUtils.addMacro(effectData, 'combat', ['starryFormActive']);
    if (effect) await genericUtils.remove(effect);
    let opts = {
        identifier: 'starryForm'
    };
    if (selection !== 'Dragon') opts.vae = [{type: 'use', name: featureData.name, identifier: 'starryForm' + selection}];
    effect = await effectUtils.createEffect(workflow.actor, effectData, opts);
    await itemUtils.createItems(workflow.actor, [featureData], {favorite: selection !== 'Dragon', parentEntity: effect});
}
async function turnStart({trigger: {token}}) {
    let twinklingItem = await itemUtils.getItemByIdentifier(token.actor, 'twinklingConstellations');
    let selection = await dialogUtils.confirm(twinklingItem.name, 'CHRISPREMADES.Macros.StarryForm.Change');
    if (!selection) return;
    await twinklingItem.use();
}
async function late({workflow}) {
    if (workflow.item.type !== 'spell' || !workflow.targets.size || !workflow.item.system.level) return;
    if (!workflow.damageItem?.damageDetail?.some(i => i.type === 'healing')) return;
    let chaliceItem = itemUtils.getItemByIdentifier(workflow.actor, 'starryFormChalice');
    if (!chaliceItem) return;
    let nearbyTargets = tokenUtils.findNearby(workflow.token, 30, 'ally', {includeIncapacitated: true, includeToken: true});
    let selected;
    if (nearbyTargets.length > 1) {
        selected = await dialogUtils.selectTargetDialog(chaliceItem.name, 'CHRISPREMADES.Macros.StarryForm.Heal', nearbyTargets);
        if (selected?.length) selected = [selected];
    }
    if (!selected) selected = nearbyTargets[0];
    await workflowUtils.syntheticItemRoll(chaliceItem, [selected]);
}
export let starryForm = {
    name: 'Starry Form',
    version: '0.12.43',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 20
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Starry Form': [
                'Starry Form: Archer',
                'Starry Form: Chalice',
                'Starry Form: Dragon'
            ]
        }
    }
};
export let starryFormActive = {
    name: 'Starry Form: Active',
    version: '0.12.41',
    midi: {
        actor: [
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
    ]
};