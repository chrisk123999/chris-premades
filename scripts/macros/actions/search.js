import {dialogUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Search.Skill', [[CONFIG.DND5E.skills.prc.label, 'prc'], [CONFIG.DND5E.skills.inv.label, 'inv']], {displayAsRows: true});
    if (!selection) return;
    await workflow.actor.rollSkill(selection);
}
export let search = {
    name: 'Search',
    version: '0.12.12',
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