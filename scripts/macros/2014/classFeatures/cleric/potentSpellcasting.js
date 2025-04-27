import {workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    if (workflow.item.type !== 'spell') return;
    let spellLevel = workflowUtils.getCastLevel(workflow) ?? workflow.item.flags?.['chris-premades']?.castData?.castLevel;
    if (spellLevel !== 0) return;
    await workflowUtils.bonusDamage(workflow, '@abilities.wis.mod', {damageType: workflow.defaultDamageType});
}
export let potentSpellcasting = {
    name: 'Potent Spellcasting',
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