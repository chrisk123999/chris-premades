import {actorUtils, constants, dialogUtils, workflowUtils} from '../../../utils.js';
async function spell({trigger, workflow}) {
    let spells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.system.activation.type === 'action');
    if (!spells.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Magic.SelectSpell', spells, {sortAlphabetical: true, showSpellLevel: true});
    if (!selection) return;
    await workflowUtils.completeItemUse(selection);
}
async function magicItem({trigger, workflow}) {
    let items = workflow.actor.items.filter(i => constants.itemTypes.includes(i.type) && i.system.properties?.has('mgc'));
    if (!items) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Magic.MagicItem', items, {sortAlphabetical: true});
    if (!selection) return;
    await workflowUtils.completeItemUse(selection);
}
export let magic = {
    name: 'Magic',
    version: '1.3.115',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: spell,
                priority: 50,
                activities: ['spell']
            },
            {
                pass: 'rollFinished',
                macro: magicItem,
                priority: 50,
                activities: ['magicItem']
            }
        ]
    }
};