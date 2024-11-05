import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let targetActor = workflow.targets.first().actor;
    let amulet = itemUtils.getItemByIdentifier(targetActor, 'mastersAmulet');
    if (!amulet) return;
    let actorUuid = amulet.flags['chris-premades']?.mastersAmulet?.actorUuid;
    if (!actorUuid) return;
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    if (workflow.actor.uuid != actor.uuid) return;
    let maxLevel = Number(itemUtils.getConfig(workflow.item, 'maxLevel'));
    if (isNaN(maxLevel)) return;
    let validSpells = actorUtils.getCastableSpells(targetActor).filter(i => i.system.level <= maxLevel);
    if (!validSpells.length) return;
    let originalSpell = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.RingOfSpellStoring.SelectSpell', validSpells, {showSpellLevel: true, addNoneDocument: true});
    if (!originalSpell) return;
    let spellData = genericUtils.duplicate(originalSpell.toObject());
    delete spellData._id;
    let spellDC = itemUtils.getSaveDC(originalSpell);
    let abilityModifier = targetActor.system.abilities[spellData.abilityMod ?? targetActor.system.attributes.spellcasting].mod;
    let bonuses;
    if (spellData.system.actionType === 'msak') {
        bonuses = (new Roll(targetActor.system.bonuses.msak.attack + ' + @prof', targetActor.getRollData()).evaluateSync({strict: false})).total;
    } else if (spellData.system.actionType === 'rsak') {
        bonuses = (new Roll(targetActor.system.bonuses.rsak.attack + ' + @prof', targetActor.getRollData()).evaluateSync({strict: false})).total;
    }
    if (bonuses) spellData.system.attack = {bonus: bonuses + abilityModifier, flat: true};
    let castLevel = spellData.system.level;
    if (originalSpell.system.level != 0) {
        if (['prepared', 'always', 'pact'].includes(spellData.system.preparation.mode)) {
            let selectedSlot = await dialogUtils.selectSpellSlot(targetActor, spellData.name, 'CHRISPREMADES.Macros.RingOfSpellStoring.Upcast', {
                maxLevel: maxLevel,
                minLevel: castLevel
            });
            if (!selectedSlot) return;
            if (selectedSlot === 'pact') {
                await genericUtils.update(targetActor, {'system.spells.pact.value': targetActor.system.spells.pact.value - 1});
                castLevel = targetActor.system.spells.pact.level;
            } else {
                let key = 'system.spells.spell' + selectedSlot + '.value';
                await genericUtils.update(targetActor, {[key]: targetActor.system.spells['spell' + selectedSlot].value - 1});
                castLevel = Number(selectedSlot);
            }
        }
    }
    if (originalSpell.system.uses.max) await genericUtils.update(originalSpell, {'system.uses.value': originalSpell.system.uses.value - 1});
    genericUtils.mergeObject(spellData, {
        system:{
            uses: {
                per: 'charges',
                max: 1,
                value: 1
            },
            preparation: {
                mode: 'atwill',
                prepared: true
            }
        }
    });
    if (spellData.system.save?.ability?.length) {
        genericUtils.mergeObject(spellData, {
            system: {
                save: {
                    scaling: 'flat',
                    dc: spellDC
                }
            }
        });
    }
    let spellMod = itemUtils.getMod(originalSpell);
    spellData.system.damage.parts.forEach(i => {
        i[0] = i[0].replaceAll('@mod', spellMod);
    });
    genericUtils.setProperty(spellData, 'flags.chris-premades.shieldGuardianSpellStoring', {
        isStored: true,
        castLevel
    });
    effectUtils.addMacro(spellData, 'midi.item', ['shieldGuardianSpellStoringSpell']);
    let itemIds = workflow.actor.items.filter(i => i.flags['chris-premades']?.shieldGuardianSpellStoring?.isStored).map(j => j.id);
    if (itemIds.length) await genericUtils.deleteEmbeddedDocuments(workflow.actor, 'Item', itemIds);
    await itemUtils.createItems(workflow.actor, [spellData], {favorite: true});
}
async function earlySpell({trigger, workflow}) {
    workflow.config.consumeSpellSlot = false;
    workflow.config.needsConfiguration = false;
    workflow.options.configureDialog = false;
    let castLevel = workflow.item.flags['chris-premades'].shieldGuardianSpellStoring.castLevel;
    if (!castLevel) return;
    workflow.castData.castLevel = castLevel;
    if (workflow.chatCard) await genericUtils.setFlag(workflow.chatCard, 'dnd5e', 'use.spellLevel', castLevel);
}
export let shieldGuardianSpellStoring = {
    name: 'Spell Storing',
    version: '1.0.36',
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
            value: 'maxLevel',
            label: 'CHRISPREMADES.Config.MaxLevel',
            type: 'text',
            default: 4,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let shieldGuardianSpellStoringSpell = {
    name: 'Spell Storing: Spell',
    version: shieldGuardianSpellStoring.version,
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