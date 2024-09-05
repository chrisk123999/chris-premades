import {dialogUtils, genericUtils, workflowUtils} from '../../../../utils.js';

async function damage({workflow}) {
    if (workflow.targets.size !== 1) return;
    let featureUses = workflow.item.system.uses.value + 1;
    let menuUses = Math.min(Math.max(1, workflow.actor.system.abilities.cha.mod), featureUses);
    let lightMenu = [];
    for (let i = menuUses; i > 0; i--) {
        let diceString = i + 'd6';
        lightMenu.push([diceString, i]);
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.HealingLight.Select', lightMenu);
    if (!selection) return;
    await genericUtils.update(workflow.item, {
        'system.uses.value': featureUses - selection
    });
    await workflowUtils.replaceDamage(workflow, selection + 'd6[healing]', {damageType: 'healing'});
}
export let healingLight = {
    name: 'Healing Light',
    version: '0.12.54',
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