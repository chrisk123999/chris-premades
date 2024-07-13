import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../utils.js';
import {upcastTargets} from '../generic/upcastTargets.js';

async function use({workflow}) {
    let concentrationEffect = effectUtils.getConcentrationEffect(workflow.actor, workflow.item);
    if (!workflow.targets.size) {
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
                key: 'system.traits.ci.value',
                mode: 0,
                value: 'frightened',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                heroism: {
                    spellMod: itemUtils.getMod(workflow.item)
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'combat', ['heroismHeroic']);
    effectUtils.addMacro(effectData, 'effect', ['heroismHeroic']);
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {concentrationItem: workflow.item, interdependent: true, identifier: 'heroism'});
    }
}
async function end({trigger: {entity: effect}}) {
    let actor = effect.parent;
    if (!actor) return;
    await genericUtils.update(actor, {'system.attributes.hp.temp': 0});
}
async function turnStart({trigger: {token}}) {
    let actor = token?.actor;
    if (!actor) return;
    let effect = effectUtils.getEffectByIdentifier(actor, 'heroism');
    if (!effect) return;
    let tempHP = effect.flags['chris-premades']?.heroism?.spellMod;
    if (!tempHP) return;
    await workflowUtils.applyDamage([token], tempHP, 'temphp');
}
export let heroism = {
    name: 'Heroism',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            },
            {
                pass: 'preambleComplete',
                macro: upcastTargets.plusOne,
                priority: 50
            }
        ]
    }
};
export let heroismHeroic = {
    name: 'Heroism: Heroic',
    version: heroism.version,
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
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