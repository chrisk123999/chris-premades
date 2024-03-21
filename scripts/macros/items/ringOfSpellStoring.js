import {constants} from '../../constants.js';
import {chris} from '../../helperFunctions.js';
import {queue} from '../../utility/queue.js';
async function item({speaker, actor, token, character, item, args, scope, workflow}) {
    async function deleteSpells(actor, onlyEmpty) {
        let rossSpells =[];
        actor.items.forEach(item => {
            if (item.flags['chris-premades']?.item?.ross?.isStored) rossSpells.push(item);
        });
        if (rossSpells.length === 0) return;
        for (let i of rossSpells) {
            if (onlyEmpty && i.system.uses.value) continue;
            await i.delete();
        }
    }
    let pickOption = await chris.dialog('Ring of Spell Storing', [['Store a spell.', 'store'], ['Toggle showing stored spells.', 'toggle'], ['Clear used spells.', 'clear'], ['Reset stored spells.', 'reset']]);
    if (!pickOption) return;
    let showSpells = workflow.item.flags['chris-premades']?.item?.ross?.showSpells
    if (showSpells === undefined) showSpells = true;
    if (pickOption === 'store') {
        let storedSpellLevels = workflow.item.flags['chris-premades']?.item?.ross?.spellSlots;
        if (!storedSpellLevels) storedSpellLevels = 0;
        if (storedSpellLevels === 5) {
            ui.notifications.info('Ring is full!');
            return;
        }
        let documents = workflow.actor.items.filter(item => {
            let prepared = item.system.preparation?.prepared;
            let mode = item.system.preparation?.mode;
            let hasUses = true;
            let uses = Number(item.system.uses?.value || 0);
            let max = Number(item.system.uses?.max || 0);
            if (max > 0 && uses === 0) hasUses = false;
            if (mode === 'atwill' || mode === 'innate' || mode === 'pact' || mode === 'always') prepared = true;
            if (item.type === 'spell' && item.system.level > 0 && 5 - storedSpellLevels >= item.system.level && prepared && hasUses) return item;
        });
        if (documents.length === 0) {
            ui.notifications.info('No spells available to store!');
            return;
        }
        let selection = await chris.selectDocument(workflow.item.name, documents, false, undefined, true);
        if (!selection) return;
        let spellMod = '';
        let originalSpell = selection[0];
        let spellData = duplicate(originalSpell.toObject());
        delete spellData._id;
        let spellDC = chris.getSpellDC(originalSpell);
        let dummyWorkflow = await (new MidiQOL.DummyWorkflow(workflow.actor, originalSpell, workflow.token, new Set([workflow.token]), {}).simulateAttack(workflow.token));
        if (dummyWorkflow.attackRoll) {
            spellMod = dummyWorkflow.attackRoll.formula.split('1d20')[1];
            if (spellMod.substring(0, 2) === ' +') {
                spellMod = spellMod.substring(3);
            }
            setProperty(spellData, 'flags.chris-premades.attackRoll', {'value': spellMod, 'enabled': true});
        }
        let castLevel;
        if (spellData.system.preparation.mode === 'prepared' || spellData.system.preparation.mode === 'pact' || spellData.system.preparation.mode === 'always') {
            let generatedCastMenu = [];
            if (workflow.actor.system.spells.pact.value && 5 - storedSpellLevels >= workflow.actor.system.spells.pact.level && spellData.system.level <= workflow.actor.system.spells.pact.level) generatedCastMenu.push(['Pact', 'pact']);
            if (workflow.actor.system.spells.spell1.value && 5 - storedSpellLevels >= 1 && spellData.system.level <= 1) generatedCastMenu.push(['1st Level', 'spell1']);
            if (workflow.actor.system.spells.spell2.value && 5 - storedSpellLevels >= 2 && spellData.system.level <= 2) generatedCastMenu.push(['2nd Level', 'spell2']);
            if (workflow.actor.system.spells.spell3.value && 5 - storedSpellLevels >= 3 && spellData.system.level <= 3) generatedCastMenu.push(['3rd Level', 'spell3']);
            if (workflow.actor.system.spells.spell4.value && 5 - storedSpellLevels >= 4 && spellData.system.level <= 4) generatedCastMenu.push(['4th Level', 'spell4']);
            if (workflow.actor.system.spells.spell5.value && 5 - storedSpellLevels >= 5 && spellData.system.level <= 5) generatedCastMenu.push(['5th Level', 'spell5']);
            if (generatedCastMenu.length === 0) {
                ui.notifications.info('No spell slots available!');
                return;
            }
            let selection = await chris.dialog('Cast at what level?', generatedCastMenu);
            if (!selection) return;
            switch (selection) {
                case 'pact':
                    castLevel = workflow.actor.system.spells.pact.level;
                    break;
                case 'spell1':
                    castLevel = 1;
                    break;
                case 'spell2':
                    castLevel = 2;
                    break;
                case 'spell3':
                    castLevel = 3;
                    break;
                case 'spell4':
                    castLevel = 4;
                    break;
                case 'spell5':
                    castLevel = 5;
                    break;
            }
            await workflow.actor.update({['system.spells.' + selection +'.value']: workflow.actor.system.spells[selection].value - 1});
        } else {
            castLevel = spellData.system.level;
        }
        if (originalSpell.system.uses.max > 0) await originalSpell.update({'system.uses.value': originalSpell.system.uses.value - 1});
        spellData.name = 'Ring of Spell Storing: ' + spellData.name;
        spellData.system.uses.per = 'charges';
        spellData.system.uses.max = 1;
        spellData.system.uses.value = 1;
        spellData.system.preparation.mode = 'atwill';
        spellData.system.preparation.prepared = true;
        if (spellData.system.save.ability != '') {
            spellData.system.save.scaling = 'flat';
            spellData.system.save.dc = spellDC;
        }
        setProperty(spellData, 'flags.chris-premades.item.ross', {
            'isStored': true,
            'castLevel': castLevel,
            'dc': spellDC,
            'mod': spellMod,
            'itemUuid': workflow.item.uuid
        });
        spellData.flags['custom-character-sheet-sections'] = {
            'sectionName': 'Ring of Spell Storing'
        };
        let onUseString = spellData.flags?.['midi-qol']?.onUseMacroName;
        let appendString = '[preItemRoll]function.chrisPremades.macros.ringOfSpellStoring.cast';
        if (onUseString === undefined) {
            setProperty(spellData, 'flags.midi-qol.onUseMacroName', appendString);
        } else {
            setProperty(spellData, 'flags.midi-qol.onUseMacroName', onUseString + ',' + appendString);
        }
        let storedSpells = workflow.item.flags['chris-premades']?.item?.ross?.storedSpells;
        if (!storedSpells) storedSpells = [];
        storedSpells.push(spellData);
        await workflow.item.setFlag('chris-premades', 'item.ross.storedSpells', storedSpells);
        let spellSlots = storedSpellLevels + castLevel;
        await workflow.item.setFlag('chris-premades', 'item.ross.spellSlots', spellSlots);
        if (showSpells) await workflow.actor.createEmbeddedDocuments('Item', [spellData]);
        await workflow.item.update({'name': 'Ring of Spell Storing (' + spellSlots + '/5)'});
        ui.notifications.info(originalSpell.name + ' stored.');
    } else if (pickOption === 'toggle') {
        await workflow.item.setFlag('chris-premades', 'item.ross.showSpells', !showSpells);
        if (showSpells) {
            deleteSpells(workflow.actor);
            ui.notifications.info('Spells toggled off.');
        } else {
            let storedSpells = workflow.item.flags['chris-premades']?.item?.ross?.storedSpells;
            if (!storedSpells) return;
            ui.notifications.info('Spells toggled on.');
            if (storedSpells.length === 0) return;
            for (let i of storedSpells) {
                i.flags['chris-premades'].item.ross.itemUuid = workflow.item.uuid;
            }
            await workflow.actor.createEmbeddedDocuments('Item', storedSpells);
        }
    } else if (pickOption === 'reset') {
        await workflow.item.setFlag('chris-premades', 'item.ross', {'storedSpells': [], 'spellSlots': 0, 'showSpells': true});
        if (showSpells) deleteSpells(workflow.actor);
        await workflow.item.update({'name': 'Ring of Spell Storing (0/5)'});
        ui.notifications.info('Ring Reset.');
    } else if (pickOption === 'clear') {
        deleteSpells(workflow.actor, true);
        ui.notifications.info('Used spells cleared.');
    }
}
async function cast({speaker, actor, token, character, item, args, scope, workflow}) {
    workflow.config.consumeSpellSlot = false;
    workflow.config.needsConfiguration = false;
    workflow.options.configureDialog = false;
    let castLevel = workflow.item.flags['chris-premades']?.item?.ross?.castLevel;
    if (!castLevel) return;
    workflow.config.consumeSpellLevel = castLevel;
    let sourceItemUuid = workflow.item.flags['chris-premades']?.item?.ross?.itemUuid;
    if (!sourceItemUuid) return;
    let sourceItem = await fromUuid(sourceItemUuid);
    if (!sourceItem) return;
    let storedSpells = sourceItem.flags['chris-premades']?.item?.ross?.storedSpells;
    if (!storedSpells) storedSpells = [];
    let arrayIndex = storedSpells.findIndex(i => i.name === workflow.item.name);
    if (arrayIndex == -1) return;
    storedSpells.splice(arrayIndex, 1);
    await sourceItem.setFlag('chris-premades', 'item.ross.storedSpells', storedSpells);
    let storedSpellLevels = sourceItem.flags['chris-premades']?.item?.ross?.spellSlots;
    if (!storedSpellLevels) storedSpellLevels = 0;
    await sourceItem.setFlag('chris-premades', 'item.ross.spellSlots', storedSpellLevels - castLevel);
    await sourceItem.update({'name': 'Ring of Spell Storing (' + (storedSpellLevels - castLevel) + '/5)'});
    async function effectMacro () {
        if (!origin) return;
        await origin.delete();
    }
    let effectData = {
        'label': workflow.item.name + ' Deletion',
        'icon': workflow.item.img,
        'origin': workflow.item.uuid,
        'duration': {
            'seconds': 604800
        },
        flags: {
            'effectmacro': {
                'onDelete': {
                    'script': chris.functionToString(effectMacro)
                }
            }
        }
    };
    await chris.createEffect(workflow.actor, effectData);
}
export let ringOfSpellStoring = {
    'item': item,
    'cast': cast
}