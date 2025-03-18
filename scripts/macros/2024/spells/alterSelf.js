import {activityUtils, actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';
async function changeAppearance({trigger, workflow}) {
    let effectData = {
        name: workflow.item.name + ' - ' + workflow.activity.name,
        img: workflow.activity.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'changeAppearance', {strict: true});
    if (!feature) {
        let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        strictlyInterdependent: true,
        vae: [
            {
                type: 'use',
                name: feature.name,
                identifier: 'alterSelf',
                activityIdentifier: 'changeAppearance'
            }
        ],
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['changeAppearanceAgain'],
            favorite: true
        }
    });
}
async function naturalWeapons({trigger, workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.AlterSelf.NaturalWeapons.Select', [['CHRISPREMADES.AlterSelf.NaturalWeapons.Claws', 'slashing'], ['CHRISPREMADES.AlterSelf.NaturalWeapons.Fangs', 'piercing'], ['CHRISPREMADES.AlterSelf.NaturalWeapons.Hooves', 'bludgeoning']]);
    let unarmedStrike = itemUtils.getItemByIdentifier(workflow.actor, 'unarmedStrike');
    if (!selection || !unarmedStrike) {
        let concentrationEffect = await effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name + ' - ' + workflow.activity.name,
        img: workflow.activity.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.properties',
                mode: 2,
                value: 'mgc',
                priority: 20
            },
            {
                key: 'system.damage.base.number',
                mode: 5,
                value: 1,
                priority: 20
            },
            {
                key: 'system.damage.base.denomination',
                mode: 5,
                value: 6,
                priority: 20
            },
            {
                key: 'system.damage.base.custom',
                mode: 5,
                value: false,
                priority: 20
            },
            {
                key: 'system.ability',
                mode: 5,
                value: workflow.item.system.ability === '' ? 'spellcasting' : workflow.item.system.ability,
                priority: 20
            },
            {
                key: 'system.damage.base.types',
                mode: 5,
                value: JSON.stringify([selection]),
                priority: 20
            }
        ]
    };
    await itemUtils.enchantItem(unarmedStrike, effectData, {
        concentrationItem: workflow.item,
        interdependent: true,
        strictlyInterdependent: true
    });
}
async function veryEarly({dialog}) {
    dialog.configure = false;
}
export let alterSelf = {
    name: 'Alter Self',
    version: '1.2.28',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: changeAppearance,
                priority: 50,
                activities: ['changeAppearance']
            },
            {
                pass: 'rollFinished',
                macro: naturalWeapons,
                priority: 50,
                activities: ['naturalWeapons']
            },
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50,
                activities: ['changeAppearanceAgain']
            }
        ]
    }
};