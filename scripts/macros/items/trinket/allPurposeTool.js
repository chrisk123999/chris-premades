import {dialogUtils, effectUtils, genericUtils, itemUtils, spellUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!itemUtils.getEquipmentState(workflow.item)) return;
    let key = genericUtils.getCPRSetting('itemCompendium');
    if (!key || key === '') return;
    let pack = game.packs.get(key);
    if (!pack) return;
    let index = await pack.getIndex({fields: ['system.type.value']});
    let tools = index.filter(i => i.system.type?.value === 'art');
    let tool = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.AllPurposeTool.Select', tools, {sortAlphabetical: true});
    if (!tool) return;
    let oldTool = workflow.actor.items.find(i => i.flags['chris-premades']?.allPurposeTool);
    if (oldTool) await oldTool.delete();
    let itemData = genericUtils.duplicate(tool.toObject());
    genericUtils.setProperty(itemData, 'flags.chris-premades.allPurposeTool', true);
    itemData.name = workflow.item.name + ': ' + itemData.name;
    let prof = itemUtils.getToolProficiency(workflow.actor, tool);
    if (!prof) genericUtils.setProperty(itemData, 'system.proficient', 1);
    await itemUtils.createItems(workflow.actor, [itemData], {parentEntity: workflow.item});
}
async function spell({trigger, workflow}) {
    let spells = await spellUtils.getSpellsOfLevel(0);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.AllPurposeTool.Spell', spells, {sortAlphabetical: true});
    if (!selection) return;
    let itemData = duplicate(selection.toObject());
    genericUtils.setProperty(itemData, 'system.sourceClass', 'artificer');
    itemData.system.properties.push('material');
    itemData.name = genericUtils.translate('CHRISPREMADES.Macros.AllPurposeTool.Name') + ': ' + itemData.name;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {parentEntity: workflow.item});
    await itemUtils.createItems(workflow.actor, [itemData], {parentEntity: effect});
}
export let allPurposeTool1 = {
    name: 'All Purpose Tool + 1',
    version: '0.12.43',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    equipment: {
        channelCreativeForces: {
            name: 'All-Purpose Tool: Channel Creative Forces',
            compendium: 'itemEquipment',
            useJournal: true,
            uses: {
                max: 1,
                per: 'dawn'
            },
            translate: 'CHRISPREMADES.Macros.AllPurposeTool.Channel'
        }
    }
};
export let allPurposeTool2 = {
    name: 'All Purpose Tool + 2',
    version: allPurposeTool1.version,
    midi: allPurposeTool1.midi,
    equipment: allPurposeTool1.equipment
};
export let allPurposeTool3 = {
    name: 'All Purpose Tool + 3',
    version: allPurposeTool1.version,
    midi: allPurposeTool1.midi,
    equipment: allPurposeTool1.equipment
};
export let channelCreativeForces = {
    name: 'All-Purpose Tool: Channel Creative Forces',
    version: allPurposeTool1.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: spell,
                priority: 50
            }
        ]
    }
};