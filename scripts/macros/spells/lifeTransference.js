import {workflowUtils} from '../../utils.js';

async function damage({workflow}) {
    if (workflow.targets.size !== 1) return;
    let damageFormula = (workflow.castData.castLevel + 1) + 'd8[necrotic]';
    let damageRoll = await new CONFIG.Dice.DamageRoll(damageFormula, {}, {type: 'necrotic'}).evaluate();
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: workflow.chatCard.speaker,
        flavor: workflow.item.name
    });
    await workflowUtils.applyDamage([workflow.token], damageRoll.total, 'none');
    let healing = damageRoll.total * 2;
    await workflowUtils.bonusDamage(workflow, healing + '[healing]', {damageType: 'healing'});
}
export let lifeTransference = {
    name: 'Life Transference',
    version: '0.12.0',
    midi: {
        item: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};