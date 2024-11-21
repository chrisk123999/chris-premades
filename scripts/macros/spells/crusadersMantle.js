import {effectUtils, genericUtils, itemUtils} from '../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'aura', ['crusadersMantleAura']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'crusadersMantle'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration': effectData.duration});
}
async function create({trigger: {entity: effect, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let effectData = {
        name: effect.name.split(':')[0],
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'system.bonuses.All-Damage',
                mode: 2,
                value: '1d4[radiant]',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                aura: true,
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
export let crusadersMantle = {
    name: 'Crusader\'s Mantle',
    version: '1.1.0',
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
export let crusadersMantleAura = {
    name: 'Crusader\'s Mantle: Aura',
    version: crusadersMantle.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'crusadersMantleAura',
            disposition: 'ally'
        }
    ]
};