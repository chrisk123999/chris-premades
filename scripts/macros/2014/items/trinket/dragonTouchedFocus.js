import {Teleport} from '../../../../lib/teleport.js';
import {itemUtils, workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (['innate', 'atwill', 'ritual'].includes(workflow.item.preparation?.mode)) return;
    let spellLevel = workflowUtils.getCastLevel(workflow) ?? workflow.item.flags?.['chris-premades']?.castData?.castLevel;
    if (!spellLevel) return;
    let matchedDamages = workflowUtils.getDamageTypes(workflow.damageRolls).intersection(new Set(['acid', 'cold', 'fire', 'lightning', 'poison']));
    if (!matchedDamages.size) return;
    await workflowUtils.bonusDamage(workflow, '1d6', {damageType: matchedDamages.first()});
}
async function lateGem({trigger: {entity: item}, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (['innate', 'atwill', 'ritual'].includes(workflow.item.preparation?.mode)) return;
    if (!workflow.item.system.level) return;
    await Teleport.target(workflow.token, workflow.token, {
        animation: itemUtils.getConfig(item, 'playAnimation') ? 'mistyStep' : 'none',
        range: 15
    });
}
export let dragonTouchedFocusSlumbering = {
    name: 'Dragon-Touched Focus (Slumbering)',
    version: '1.1.0'
};
export let dragonTouchedFocusStirringChromatic = {
    name: 'Dragon-Touched Focus (Stirring / Chromatic)',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};
export let dragonTouchedFocusStirringGem = {
    name: 'Dragon-Touched Focus (Stirring / Gem)',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: lateGem,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'playAnimation',
            label: 'CHRISPREMADES.Config.PlayAnimation',
            type: 'checkbox',
            default: true,
            category: 'animation'
        }
    ]
};