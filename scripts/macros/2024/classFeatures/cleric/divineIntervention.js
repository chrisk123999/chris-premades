import {compendiumUtils, dialogUtils, effectUtils, genericUtils, itemUtils, rollUtils, spellUtils, workflowUtils} from '../../../../utils.js';
async function use({trigger: {entity: item}, workflow}) {
    let maxLevel = itemUtils.getConfig(workflow.item, 'maxLevel');
    let spells = (await spellUtils.getClassSpells(itemUtils.getConfig(workflow.item, 'classIdentifier'))).filter(i => i.system.level <= maxLevel && i.system.activation != 'reaction');
    let greaterDivineIntervention = itemUtils.getItemByIdentifier(workflow.actor, 'greaterDivineIntervention');
    if (greaterDivineIntervention) {
        let key = genericUtils.getCPRSetting('spellCompendium');
        let pack = game.packs.get(key);
        if (pack) {
            let wish = await compendiumUtils.getItemFromCompendium(key, 'wish', {byIdentifier: true});
            if (wish) spells.push(wish);
        }
    }
    if (!spells.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Generic.SelectSpell', spells, {sortAlphabetical: true});
    if (!selection) return;
    let selectionIdentifier = genericUtils.getIdentifier(selection);
    if (selectionIdentifier === 'wish' && greaterDivineIntervention) {
        await greaterDivineIntervention.displayCard();
        let {roll} = await rollUtils.rollDice(itemUtils.getConfig(greaterDivineIntervention, 'restFormula'), {chatMessage: true, flavor: greaterDivineIntervention.name});
        let sourceEffect = greaterDivineIntervention.effects.contents?.[0];
        if (sourceEffect) {
            let effectData = genericUtils.duplicate(sourceEffect.toObject());
            effectData.origin = greaterDivineIntervention.uuid;
            genericUtils.setProperty(effectData, 'flags.chris-premades.greaterDivineInterventionRest.value', roll.total);
            await itemUtils.enchantItem(item, effectData);
        }
    }
    let itemData = genericUtils.duplicate(selection.toObject());
    itemData.system.properties = itemData.system.properties.filter(i => i != 'material');
    itemData.system.materials = {
        value: '',
        consumed: false,
        cost: 0,
        supply: 0
    };
    itemData.system.method = 'innate';
    itemData.system.activation.type = 'special';
    let newItem = await itemUtils.syntheticItem(itemData, workflow.actor);
    await workflowUtils.completeItemUse(newItem, undefined, {configureDialog: false});
}
export let divineIntervention = {
    name: 'Divine Intervention',
    version: '1.2.27',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'cleric',
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'maxLevel',
            label: 'CHRISPREMADES.Config.MaxLevel',
            type: 'number',
            default: 5,
            category: 'homebrew',
            homebrew: true
        }
    ]
};