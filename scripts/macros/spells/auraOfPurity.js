import {actorUtils, effectUtils, genericUtils, tokenUtils, workflowUtils} from '../../utils.js';
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
    effectUtils.addMacro(effectData, 'aura', ['auraOfPurityAura']);
    await effectUtils.createEffect(workflow.actor, effectData, {concentrationItem: workflow.item, strictlyInterdependent: true, identifier: 'auraOfPurity'});
    if (concentrationEffect) await genericUtils.update(concentrationEffect, {'duration.seconds': effectData.duration.seconds});
}
async function create({trigger: {entity: effect, target, identifier}}) {
    let targetEffect = effectUtils.getEffectByIdentifier(target.actor, identifier);
    if (targetEffect) return;
    let conditionResistances = ['blinded', 'charmed', 'deafened', 'frightened', 'paralyzed', 'poisoned', 'stunned'];
    let effectData = {
        name: effect.name.split(':')[0],
        img: effect.img,
        origin: effect.uuid,
        duration: {
            seconds: effect.duration.remaining
        },
        changes: [
            {
                key: 'system.traits.ci.value',
                mode: 0,
                value: 'diseased',
                priority: 20
            },
            {
                key: 'system.traits.dr.value',
                mode: 0,
                value: 'poison',
                priority: 20
            },
            ...conditionResistances.map(condition => { 
                return {
                    key: 'flags.chris-premades.CR.' + condition,
                    mode: 5,
                    value: 1,
                    priority: 20
                };
            })
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
    effectUtils.addMacro(effectData, 'combat', ['auraOfPurityAura']);
    await effectUtils.createEffect(target.actor, effectData, {identifier});
}
export let auraOfPurity = {
    name: 'Aura of Purity',
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
export let auraOfPurityAura = {
    name: 'Aura of Purity: Aura',
    version: auraOfPurity.version,
    aura: [
        {
            pass: 'create',
            macro: create,
            priority: 50,
            distance: 30,
            identifier: 'auraOfPurityAura',
            disposition: 'ally'
        }
    ]
};