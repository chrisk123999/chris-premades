import {activityUtils, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let activityIdentifier = activityUtils.getIdentifier(workflow.activity);
    let isLower = activityIdentifier === 'tashasOtherworldlyGuiseLower';
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: isLower ? 'fire' : 'radiant',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 2,
                value: isLower ? 'poison' : 'necrotic',
                priority: 20
            },
            {
                key: 'system.traits.ci.value',
                mode: 2,
                value: isLower ? 'poisoned' : 'charmed',
                priority: 20
            },
            {
                key: 'system.attributes.movement.fly',
                mode: 4,
                value: genericUtils.handleMetric(40),
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: '+2',
                priority: 20
            }
        ]
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['tashasOtherworldlyGuiseBuffed']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'tashasOtherworldlyGuise'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function early({trigger: {entity: effect}, workflow}) {
    if (workflow.item.type !== 'weapon') return;
    if (workflow.activity.type !== 'attack') return;
    let scaling = workflow.actor.system.attributes.spellcasting;
    let itemScaling = workflow.activity.ability;
    if (!itemScaling) itemScaling = 'str';
    let properties = genericUtils.deepClone(workflow.item.system.properties);
    properties.add('mgc');
    properties = Array.from(properties);
    let ability = workflow.activity.ability;
    if (workflow.actor.system.abilities[itemScaling].mod < workflow.actor.system.abilities[scaling].mod) ability = scaling;
    workflow.item = workflow.item.clone({
        'system.properties': properties
    }, {keepId: true});
    workflow.item.prepareData();
    workflow.item.applyActiveEffects();
    workflow.activity = activityUtils.duplicateActivity(workflow.activity);
    workflow.activity.attack.ability = ability;
}
export let tashasOtherworldlyGuise = {
    name: 'Tasha\'s Otherworldly Guise',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['tashasOtherworldlyGuiseLower', 'tashasOtherworldlyGuiseUpper']
            }
        ]
    }
};
export let tashasOtherworldlyGuiseBuffed = {
    name: 'Tasha\'s Otherworldly Guise: Buffed',
    version: tashasOtherworldlyGuise.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};