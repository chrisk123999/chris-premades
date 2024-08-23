import {actorUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: {
            seconds: 60 * workflow.item.system.duration.value
        },
        flags: {
            'chris-premades': {
                auraOfLife: {
                    removeTempmaxDebuffs: itemUtils.getConfig(workflow.item, 'removeTempmaxDebuffs')
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'aura', ['auraOfLifeAura']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'auraOfLife'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
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
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'necrotic',
                priority: 50
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
    if (effect.flags['chris-premades'].auraOfLife.removeTempmaxDebuffs) {
        effectData.changes.push({
            key: 'system.attributes.hp.tempmax',
            mode: 4,
            value: 0,
            priority: 50
        });
    }
    effectUtils.addMacro(effectData, 'combat', ['auraOfLifeAura']);
    effectUtils.addMacro(effectData, 'preCreateEffect', ['auraOfLifeAura']);
    effectUtils.addMacro(effectData, 'preUpdateEffect', ['auraOfLifeAura']);
    // await effectUtils.createEffect(target.actor, effectData, {identifier});
    return {
        effectData,
        effectOptions: {
            identifier
        }
    };
}
async function turnStart({trigger: {token}}) {
    if (token.actor?.system.attributes.hp.value === 0) {
        await workflowUtils.applyDamage([token], 1, 'healing');
    }
}
function preEffect(effect, updates, options) {
    if (!updates.changes || !updates.changes.length || !effect.parent) return;
    if (effect.parent?.documentName !== 'Actor') return;
    if (!effectUtils.getEffectByIdentifier(effect.parent, 'auraOfLifeAura')) return;
    let changed = false;
    for (let i of updates.changes) {
        if (i.key !== 'system.attributes.hp.tempmax') continue;
        let number = Number(i.value);
        if (isNaN(number) || number >= 0) continue;
        i.value = 0;
        changed = true;
    }
    if (!changed) return;
    effect.updateSource({'changes': updates.changes});
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
    },
    config: [
        {
            value: 'removeTempmaxDebuffs',
            label: 'CHRISPREMADES.Macros.AuraOfLife.RemoveTempmax',
            type: 'checkbox',
            default: false,
            category: 'mechanics'
        }
    ]
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
            identifier: 'auraOfLifeAura',
            disposition: 'ally'
        }
    ],
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ],
    preCreateEffect: [
        {
            macro: preEffect
        }
    ],
    preUpdateEffect: [
        {
            macro: preEffect
        }
    ]
};