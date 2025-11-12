import {effectUtils, genericUtils, workflowUtils} from '../../../../utils.js';
async function early({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let conditions = ['grappled', 'incapacitated', 'restrained'];
    let valid = conditions.find(i => effectUtils.getEffectByStatusID(workflow.targets.first().actor, i));
    let charmed = effectUtils.getEffectByIdentifier(workflow.targets.first().actor, 'charmPersonEffect');
    if (!valid && !charmed) {
        workflowUtils.removeTargets(workflow, [workflow.targets.first()]);
        return;
    }
    if (charmed) {
        if (charmed.flags['chris-premades']?.specialDuration?.includes('attackedByAnotherCreature')) return;
        await genericUtils.setFlag(charmed, 'chris-premades', 'specialDuration', ['attackedByAnotherCreature']);
    }
}
export let vampireBite = {
    name: 'Bite (Bat or Vampire Form Only)',
    aliases: ['Bite'],
    monster: 'Vampire',
    version: '1.3.126',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            }
        ]
    }
};