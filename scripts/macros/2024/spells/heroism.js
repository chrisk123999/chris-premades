import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
import {upcastTargets} from '../../generic/upcastTargets.js';

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
        duration: itemUtils.convertDuration(workflow.item),
        changes: [
            {
                key: 'system.traits.ci.value',
                mode: 2,
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
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {
            concentrationItem: workflow.item,
            interdependent: true,
            identifier: 'heroism',
            rules: 'modern'
        });
    }
}
async function turnStart({trigger: {effect, token}}) {
    let actor = token?.actor;
    if (!actor) return;
    let tempHP = effect.flags['chris-premades']?.heroism?.spellMod;
    if (!tempHP) return;
    await workflowUtils.applyDamage([token], tempHP, 'temphp');
}
export let heroism = {
    name: 'Heroism',
    version: '1.2.29',
    rules: 'modern',
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
    rules: heroism.rules,
    combat: [
        {
            pass: 'turnStart',
            macro: turnStart,
            priority: 50
        }
    ]
};