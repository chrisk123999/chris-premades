import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';

async function use({workflow}) {
    let storedSpellSlots = Number(workflow.item.flags['chris-premades']?.ross?.spellSlots ?? 0);
    let maxSpellSlots = 5; // Maybe we wanna let people homebrew it idk
    let usedRossSpells = workflow.actor.items.filter(i => i.type === 'spell' && i.flags['chris-premades']?.ross?.isStored && !i.system.uses.value && i.flags['chris-premades'].ross.itemUuid === workflow.item.uuid);
    let maxSlotUsable = maxSpellSlots - storedSpellSlots;
    let buttons = [];
    if (maxSlotUsable) {
        buttons.push(['CHRISPREMADES.Macros.RingOfSpellStoring.Store', 'store']);
    }
    if (usedRossSpells.length) buttons.push(['CHRISPREMADES.Macros.RingOfSpellStoring.Clear', 'clear']);
    if (storedSpellSlots) {
        buttons.push(['CHRISPREMADES.Macros.RingOfSpellStoring.Reset', 'reset']);
    }
    let selection = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Dialog.WhatDo', buttons);
    if (!selection) return;
    if (selection === 'store') {
        let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.system.level > 0 && i.system.level <= maxSlotUsable && !i.flags['chris-premades']?.ross?.isStored);
        if (!validSpells.length) {
            genericUtils.notify('CHRISPREMADES.Macros.RingOfSpellStoring.NoSpells', 'info');
            return;
        }
        validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
        validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
        let originalSpell = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.RingOfSpellStoring.SelectSpell', validSpells, {
            showSpellLevel: true,
            addNoneDocument: true
        });
        if (!originalSpell) return;
        let attackMod = '';
        let spellData = genericUtils.duplicate(originalSpell.toObject());
        delete spellData._id;
        let spellDC = itemUtils.getSaveDC(originalSpell);
        let abilityModifier = workflow.actor.system.abilities[spellData.abilityMod ?? workflow.actor.system.attributes.spellcasting].mod;
        let msakBonus = (new Roll(workflow.actor.system.bonuses.msak.attack + ' + @prof', workflow.actor.getRollData()).evaluateSync({strict: false})).total;
        let rsakBonus = (new Roll(workflow.actor.system.bonuses.rsak.attack + ' + @prof', workflow.actor.getRollData()).evaluateSync({strict: false})).total;
        let spellMod = workflow.actor.system.attributes.spellmod;
        let spellActivityData = originalSpell.system.activities.contents;
        for (let spellActivity of spellActivityData) {
            if (spellActivity.actionType === 'msak') {
                spellData.system.activities[spellActivity.id].attack.bonus = msakBonus + abilityModifier;
                spellData.system.activities[spellActivity.id].attack.flat = true;
            } else if (spellActivity.actionType === 'rsak') {
                spellData.system.activities[spellActivity.id].attack.bonus = rsakBonus + abilityModifier;
                spellData.system.activities[spellActivity.id].attack.flat = true;
            } else if (spellActivity.actionType === 'save') {
                spellData.system.activities[spellActivity.id].save.dc = {
                    calculation: '',
                    formula: spellDC.toString(),
                    value: spellDC
                };
            }
            if (spellActivity.damage) {
                for (let i = 0; i < spellActivity.damage.parts.length; i++) {
                    spellData.system.activities[spellActivity.id].damage.parts[i].custom = {
                        enabled: true,
                        formula: spellActivity.damage.parts[i].formula.replaceAll('@mod', spellMod)
                    };
                }
            } else if (spellActivity.healing) {
                spellData.system.activities[spellActivity.id].healing.custom = {
                    enabled: true,
                    formula: spellActivity.healing.formula.replaceAll('@mod', spellMod)
                };
            }
        }
        spellData.system.activities[spellActivityData[0].id].consumption.targets = [{
            type: 'itemUses',
            value: '1'
        }];
        let castLevel = spellData.system.level;
        if (['prepared', 'always', 'pact'].includes(spellData.system.preparation.mode)) {
            let selectedSlot = await dialogUtils.selectSpellSlot(workflow.actor, spellData.name, 'CHRISPREMADES.Macros.RingOfSpellStoring.Upcast', {
                maxLevel: maxSlotUsable,
                minLevel: castLevel
            });
            if (!selectedSlot) return;
            if (selectedSlot === 'pact') {
                await genericUtils.update(workflow.actor, {'system.spells.pact.value': workflow.actor.system.spells.pact.value - 1});
                castLevel = workflow.actor.system.spells.pact.level;
            } else {
                let key = 'system.spells.spell' + selectedSlot + '.value';
                await genericUtils.update(workflow.actor, {[key]: workflow.actor.system.spells['spell' + selectedSlot].value - 1});
                castLevel = Number(selectedSlot);
            }
        }
        if (originalSpell.system.uses.max) await genericUtils.update(originalSpell, {'system.uses.spent': originalSpell.system.uses.spent + 1});
        spellData.name = genericUtils.format('CHRISPREMADES.Macros.RingOfSpellStoring.SpellName', {spellName: spellData.name});
        genericUtils.mergeObject(spellData, {
            system:{
                uses: {
                    max: 1,
                    spent: 0
                },
                preparation: {
                    mode: 'atwill',
                    prepared: true
                }
            }
        });
        genericUtils.setProperty(spellData, 'flags.chris-premades.ross', {
            isStored: true,
            castLevel,
            dc: spellDC,
            mod: attackMod,
            itemUuid: workflow.item.uuid
        });
        effectUtils.addMacro(spellData, 'midi.item', ['ringOfSpellStoringSpell']);
        await genericUtils.update(workflow.item, {
            name: genericUtils.format('CHRISPREMADES.Macros.RingOfSpellStoring.Name', {currSpellSlots: storedSpellSlots + castLevel, maxSpellSlots}),
            flags: {
                'chris-premades': {
                    ross: {
                        storedSpells: (workflow.item.flags['chris-premades']?.ross?.storedSpells ?? []).concat(spellData),
                        spellSlots: storedSpellSlots + castLevel
                    }
                }
            }
        });
        if (itemUtils.getEquipmentState(workflow.item)) {
            await itemUtils.createItems(workflow.actor, [spellData], {favorite: true, parentEntity: workflow.item, section: genericUtils.translate('CHRISPREMADES.Section.RingOfSpellStoring')});
        }
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Macros.RingOfSpellStoring.Stored', {spellName: spellData.name}), 'info');
        return;
    } else if (selection === 'clear') {
        for (let usedSpell of usedRossSpells) {
            await genericUtils.remove(usedSpell);
        }
        genericUtils.notify('CHRISPREMADES.Macros.RingOfSpellStoring.Cleared', 'info');
        return;
    } else {
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'ross', {
            storedSpells: [],
            spellSlots: 0
        });
        await genericUtils.update(workflow.item, {name: genericUtils.format('CHRISPREMADES.Macros.RingOfSpellStoring.Name', {currSpellSlots: 0, maxSpellSlots})});
        genericUtils.notify('CHRISPREMADES.Macros.RingOfSpellStoring.ResetDone', 'info');
        return;
    }
}
async function equipOrUpdateRing(item) {
    let storedSpells = item.flags['chris-premades']?.ross?.storedSpells;
    if (!storedSpells?.length) return;
    for (let i of storedSpells) {
        i.flags['chris-premades'].ross.itemUuid = item.uuid;
    }
    await itemUtils.createItems(item.actor, storedSpells, {favorite: true, parentEntity: item, section: genericUtils.translate('CHRISPREMADES.Section.RingOfSpellStoring')});
}
async function unequipRing(item) {
    let rossSpells = item.actor.items.filter(i => i.type === 'spell' && i.flags['chris-premades']?.ross?.isStored && i.flags['chris-premades'].ross.itemUuid === item.uuid);
    for (let i of rossSpells) await genericUtils.remove(i);
}
async function earlySpell({workflow}) {
    workflow.config.consumeSpellSlot = false;
    workflow.config.needsConfiguration = false;
    workflow.options.configureDialog = false;
    let castLevel = workflow.item.flags['chris-premades'].ross.castLevel;
    if (!castLevel) return;
    workflow.castData.castLevel = castLevel;
    if (workflow.chatCard) await genericUtils.setFlag(workflow.chatCard, 'dnd5e', 'use.spellLevel', castLevel);
    let originItem = await fromUuid(workflow.item.flags['chris-premades'].ross.itemUuid);
    if (!originItem) return;
    let rossFlags = originItem.flags['chris-premades'].ross;
    let storedSpells = rossFlags.storedSpells ?? [];
    let ind = storedSpells.findIndex(i => i.name === workflow.item.name);
    if (ind < 0) return;
    storedSpells.splice(ind, 1);
    let spellSlots = rossFlags.spellSlots ?? castLevel;
    spellSlots -= castLevel;
    let maxSpellSlots = 5;
    await genericUtils.update(originItem, {
        name: genericUtils.format('CHRISPREMADES.Macros.RingOfSpellStoring.Name', {currSpellSlots: spellSlots, maxSpellSlots}),
        'flags.chris-premades.ross': {
            storedSpells,
            spellSlots
        }
    });
    await actorUtils.removeFavorites(workflow.actor, [workflow.item]);
}
export let ringOfSpellStoring = {
    name: 'Ring of Spell Storing (0/5)',
    version: '1.1.0',
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
        ringOfSpellStoring: {
            equipCallback: equipOrUpdateRing,
            unequipCallback: unequipRing
        }
    },
    ddbi: {
        renamedItems: {
            'Ring of Spell Storing': 'Ring of Spell Storing (0/5)'
        }
    }
};
export let ringOfSpellStoringSpell = {
    name: 'Ring of Spell Storing: Spell',
    version: ringOfSpellStoring.version,
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: earlySpell,
                priority: 50
            }
        ]
    }
};