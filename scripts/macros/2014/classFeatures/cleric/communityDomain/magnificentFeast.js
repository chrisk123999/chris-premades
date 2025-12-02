import {compendiumUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let itemData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Magnificent Feast', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.MagnificentFeast.MagnificentFeast'});
    if (!itemData) return;
    let classIdentifier = itemUtils.getConfig(workflow.item, 'classIdentifier');
    if (!workflow.actor.classes[classIdentifier]) return;
    let activityId = Object.keys(itemData.system.activities)[0];
    itemData.system.activities[activityId].healing.bonus = workflow.actor.classes[classIdentifier].system.levels;
    let effectData = {
        name: itemData.name,
        type: 'enchantment',
        duration: itemUtils.convertDuration(workflow.activity),
        img: itemData.img,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                macros: {
                    effect: [
                        'magnificentFeastEffect'
                    ]
                }
            }
        }
    };
    itemData.effects = [effectData];
    await Promise.all(workflow.targets.map(async token => {
        await itemUtils.createItems(token.actor, [itemData]);
    }));
}
async function heal({trigger, workflow}) {
    let poisoned = effectUtils.getEffectByStatusID(workflow.actor, 'poisoned');
    let frightened = effectUtils.getEffectByStatusID(workflow.actor, 'frightened');
    let selection;
    if (poisoned && frightened) {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.RemoveWhichCondition', [poisoned, frightened]);
    } else {
        selection = poisoned ?? frightened;
    }
    if (!selection) return;
    await genericUtils.remove(selection);
}
async function rest({trigger: {entity: item}}) {
    await genericUtils.remove(item);
}
async function added({trigger: {entity: item}}) {
    let feature = itemUtils.getItemByIdentifier(item.actor, 'turnUndead') ?? itemUtils.getItemByIdentifier(item.actor, 'channelDivinity');
    if (!feature) return;
    let identifier = genericUtils.getIdentifier(feature);
    await itemUtils.correctActivityItemConsumption(item, ['use'], identifier);
}
async function remove({trigger: {entity: effect}}) {
    await genericUtils.remove(effect.parent);
}
export let magnificentFeast = {
    name: 'Channel Divinity: Magnificent Feast',
    version: '1.3.151',
    rules: 'legacy',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    item: [
        {
            pass: 'created',
            macro: added,
            priority: 55
        },
        {
            pass: 'itemMedkit',
            macro: added,
            priority: 55
        },
        {
            pass: 'actorMunch',
            macro: added,
            priority: 55
        }
    ],
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'cleric',
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let magnificentFeastMeal = {
    name: 'Magnificent Feast: Magnificent Meal',
    version: magnificentFeast.version,
    rules: magnificentFeast.rules,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: heal,
                priority: 50
            }
        ]
    },
    rest: [
        {
            pass: 'long',
            macro: rest,
            priority: 50
        }
    ]
};
export let magnificentFeastEffect = {
    name: 'Magnificent Feast: Effect',
    version: magnificentFeast.version,
    rules: magnificentFeast.rules,
    effect: [
        {
            pass: 'deleted',
            macro: remove,
            priority: 50
        }
    ]
};