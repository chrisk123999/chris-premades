import {dialogUtils} from '../../utils.js';
async function use({trigger, workflow}) {
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Search.Skill', [[CONFIG.DND5E.skills.prc.label, 'prc'], [CONFIG.DND5E.skills.inv.label, 'inv']], {displayAsRows: true});
    if (!selection) return;
    await workflow.actor.rollSkill({skill: selection});
}
export let search = {
    name: 'Search',
    version: '1.1.0',
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