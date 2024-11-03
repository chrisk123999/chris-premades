import {effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'aura', ['leadershipAura']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'leadership'});
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
                key: 'system.bonuses.All-Attacks',
                mode: 2,
                value: '1d4',
                priority: 20
            },
            {
                key: 'system.bonuses.abilities.save',
                mode: 2,
                value: '1d4',
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
export let leadership = {
    name: 'Leadership',
    version: '1.0.37',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    monster: [
        'Hobgoblin Captain',
        'Hobgoblin Warlord'
    ]
};
export let leadershipAura = {
    name: 'Leadership: Aura',
    version: leadership.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'leadershipAura',
            disposition: 'ally'
        }
    ]
};