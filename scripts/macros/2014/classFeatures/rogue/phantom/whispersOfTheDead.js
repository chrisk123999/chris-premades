import {dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../../../utils.js';
async function rest({trigger: {entity: item}, actor}) {
    let { proficiencyLevels, skills, tools } = CONFIG.DND5E; 
    let profs = actor.system.skills;
    let skillChoices = Object.keys(skills).map(s => ({
        name: skills[s].label + (profs[s]?.value > 0 ? ` [${proficiencyLevels[profs[s]?.value]}]` : ''),
        system: { description: { value: '' }},
        reference: skills[s].reference,
        img: skills[s].icon,
        id: 'skills.' + s
    }));
    let key = genericUtils.getCPRSetting('itemCompendium') || (game.settings.get('dnd5e', 'rulesVersion') === 'legacy' ? 'dnd5e.items' : 'dnd5e.equipment24');
    let pack = game.packs.get(key);
    let toolChoices = [];
    if (pack) {
        let index = await pack.getIndex({fields: ['system.type.baseItem', 'system.description.value']});
        profs = actor.system.tools;
        toolChoices = index.filter(i => i.type === 'tool').map(t => {
            let id = t.system.type.baseItem || 
                Object.keys(tools).find(a => tools[a].id === t.uuid) || 
                genericUtils.format('CHRISPREMADES.Macros.WhispersOfTheDead.UnknownTool', {name: t.name});
            return {
                name: t.name + (profs[id]?.value > 0 ? ` [${proficiencyLevels[profs[id]?.value]}]` : ''),
                system: { description: { value: t.system.description.value }},
                id: 'tools.' + id,
                img: t.img
            };
        });
    }
    let selection = await dialogUtils.selectDocumentDialog(
        item.name, 
        'CHRISPREMADES.Macros.WhispersOfTheDead.Prompt', 
        [...skillChoices, ...toolChoices], 
        {sortAlphabetical: true, displayReference: true, displayTooltips: true}
    );
    if (!selection) return;
    await workflowUtils.syntheticItemRoll(item, []);
    await effectUtils.createEffect(actor, {
        name: item.name,
        img: item.img,
        origin: item.uuid,
        changes: [{
            key: `system.${selection.id}.value`,
            value: 1,
            mode: 4,
            priority: 20
        }],
        flags: { dae: {
            stackable: 'noneName'
        }}
    });
}
export let whispersOfTheDead = {
    name: 'Whispers of the Dead',
    version: '1.5.15',
    rest: [
        {
            pass: 'short',
            macro: rest,
            priority: 50
        }
    ],
    ddbi: {
        correctedItems: {
            'Whispers of the Dead': {
                name: 'Whispers of the Dead'
            }
        }
    }
};
