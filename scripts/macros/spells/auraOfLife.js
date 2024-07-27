import {actorUtils, effectUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';
// IN PROGRESS
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        }
    };
    effectUtils.addMacro(effectData, 'aura', ['auraOfLifeAura']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'auraOfLife'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function create({trigger: {entity: effect, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier + 'Aura');
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
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'necrotic',
                priority: 50
            },
            {
                key: 'system.attributes.hp.tempmax',
                mode: 4,
                value: 0,
                priority: 50
            }
        ],
        flags: {
            'chris-premades': {
                aura:true,
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.addMacro(effectData, 'combat', ['auraOfLifeAura']);
    await effectUtils.createEffect(target.actor, effectData, {identifier: identifier + 'Aura'});
}
async function turnStart({trigger: {token}}) {
    if (token.actor?.system.attributes.hp.value === 0) {
        await workflowUtils.applyDamage([token], 1, 'healing');
    }
}
export let auraOfLife = {
    name: 'Aura of Life',
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
export let auraOfLifeAura = {
    name: 'Aura of Life: Aura',
    version: auraOfLife.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'auraOfLife',
            disposition: 'ally'
        }
    ],
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};