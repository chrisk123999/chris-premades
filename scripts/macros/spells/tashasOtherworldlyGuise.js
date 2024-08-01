import {dialogUtils, effectUtils, genericUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.TashasOtherworldlyGuise.Select', [['CHRISPREMADES.Macros.TashasOtherworldlyGuise.Upper', 'upper'], ['CHRISPREMADES.Macros.TashasOtherworldlyGuise.Lower', 'lower']], {displayAsRows: true});
    if (!selection) {
        if (concentrationEffect) await genericUtils.remove(concentrationEffect);
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        changes: [
            {
                key: 'system.traits.di.value',
                mode: 0,
                value: 'fire',
                priority: 20
            },
            {
                key: 'system.traits.di.value',
                mode: 0,
                value: 'poison',
                priority: 20
            },
            {
                key: 'system.traits.ci.value',
                mode: 0,
                value: 'poisoned',
                priority: 20
            },
            {
                key: 'system.attributes.movement.fly',
                mode: 4,
                value: 40,
                priority: 20
            },
            {
                key: 'system.attributes.ac.bonus',
                mode: 2,
                value: '+2',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                tashasOtherworldlyGuise: {
                    scaling: workflow.item.system.save.scaling
                }
            }
        }
    };
    if (selection === 'upper') {
        effectData.changes[0].value = 'radiant';
        effectData.changes[1].value = 'necrotic';
        effectData.changes[2].value = 'charmed';
    }
    effectUtils.addMacro(effectData, 'midi.actor', ['tashasOtherworldlyGuiseBuffed']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'tashasOtherworldlyGuise'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function early({workflow}) {
    if (workflow.item.type !== 'weapon') return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'tashasOtherworldlyGuise');
    if (!effect) return;
    let scaling = effect.flags['chris-premades'].tashasOtherworldlyGuise.scaling;
    if (scaling === 'spell') scaling = workflow.actor.system.attributes.spellcasting;
    let itemScaling = workflow.item.system.ability;
    if (!itemScaling) itemScaling = 'str';
    let properties = genericUtils.deepClone(workflow.item.system.properties);
    properties.add('mgc');
    properties = Array.from(properties);
    let ability = genericUtils.duplicate(workflow.item.system.ability);
    if (workflow.actor.system.abilities[itemScaling].mod < workflow.actor.system.abilities[scaling].mod) ability = scaling;
    workflow.item = workflow.item.clone({'system.properties': properties, 'system.ability': ability}, {keepId: true});
    workflow.item.prepareData();
    workflow.item.prepareFinalAttributes();
    workflow.item.applyActiveEffects();
}
export let tashasOtherworldlyGuise = {
    name: 'Tasha\'s Otherworldly Guise',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
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