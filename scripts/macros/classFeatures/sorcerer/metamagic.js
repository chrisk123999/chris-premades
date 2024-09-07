import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';

async function useCareful({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || !sorcPoints.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.hasSave);
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 1, plural: ''}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['carefulSpell']);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'metamagic'});
    if (!effect) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 1});
    // TODO: targeting?
    await workflowUtils.completeItemUse(selection);
    if (effect) await genericUtils.remove(effect);
}
async function earlyCareful({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size) return;
    let max = Math.max(1, workflow.actor.system.abilities.cha.mod ?? 0);
    let targets = Array.from(workflow.targets);
    // TODO: do we actually want to restrict this?
    // targets = targets.filter(i => i.document.disposition === workflow.token.document.disposition);
    let selection = await dialogUtils.selectTargetDialog(effect.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.CarefulWhich', {max}), targets, {
        type: 'multiple',
        maxAmount: max
    });
    if (!selection?.length) return;
    selection = selection[0];
    let effectData = {
        name: effect.name,
        img: constants.tempConditionIcon,
        origin: effect.uuid,
        changes: [
            {
                key: 'flags.midi-qol.min.ability.save.all',
                mode: 5,
                value: 100,
                priority: 120
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    for (let target of selection) {
        await effectUtils.createEffect(target.actor, effectData, {parentEntity: effect});
    }
}
async function useDistant({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || !sorcPoints.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => ['touch', 'ft'].includes(i.system.range.units) && i.system.target.type?.length && i.system.target.type !== 'self');
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 1, plural: ''}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 1});
    let itemUpdate;
    if (selection.system.range.units === 'touch') {
        itemUpdate = {'system.range': {units: 'ft', value: 30}};
    } else {
        itemUpdate = {'system.range.value': selection.system.range.value * 2};
    }
    let newItem = selection.clone(itemUpdate, {keepId: true});
    newItem.prepareData();
    newItem.prepareFinalAttributes();
    newItem.applyActiveEffects();
    await workflowUtils.syntheticItemRoll(newItem, Array.from(workflow.targets), {options: {configureDialog: true}, config: {consumeSpellSlot: true, consumeUsage: newItem.system.hasLimitedUses ? true : null}});
}
async function damageEmpowered({workflow}) {
    if (!workflow.hitTargets.size || workflow.item.type !== 'spell') return;
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    let sorcPointsValue = sorcPoints?.system.uses.value;
    if (!sorcPointsValue) return;
    // todo absolutely not, nope not today satan
}
async function useExtended({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || !sorcPoints.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => itemUtils.convertDuration(i).seconds >= 60);
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 1, plural: ''}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 1});
    let newDuration = Math.min(86400, itemUtils.convertDuration(selection).seconds * 2);
    newDuration /= 60;
    let newItem = selection.clone({'system.duration': {value: newDuration, units: 'minute'}}, {keepId: true});
    newItem.prepareData();
    newItem.prepareFinalAttributes();
    newItem.applyActiveEffects();
    await workflowUtils.syntheticItemRoll(newItem, Array.from(workflow.targets), {options: {configureDialog: true}, config: {consumeSpellSlot: true, consumeUsage: newItem.system.hasLimitedUses ? true : null}});
}
async function useHeightened({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || sorcPoints.system.uses.value < 3) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.hasSave);
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 3, plural: 's'}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['heightenedSpell']);
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'metamagic'});
    if (!effect) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 3});
    // TODO: targeting?
    await workflowUtils.completeItemUse(selection);
    if (effect) await genericUtils.remove(effect);
}
async function earlyHeightened({trigger: {entity: effect}, workflow}) {
    if (!workflow.targets.size) return;
    let targets = Array.from(workflow.targets);
    targets = targets.filter(i => i.document.disposition !== workflow.token.document.disposition);
    let selection = await dialogUtils.selectTargetDialog(effect.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.HeightenedWhich'), targets);
    if (!selection?.length) return;
    selection = selection[0];
    let effectData = {
        name: effect.name,
        img: constants.tempConditionIcon,
        origin: effect.uuid,
        changes: [
            {
                key: 'flags.midi-qol.disadvantage.ability.save.all',
                mode: 5,
                value: 1,
                priority: 20
            }
        ],
        flags: {
            dae: {
                specialDuration: [
                    'isSave'
                ]
            },
            'chris-premades': {
                effect: {
                    noAnimation: true
                }
            }
        }
    };
    await effectUtils.createEffect(selection.actor, effectData, {parentEntity: effect});
}
async function useQuickened({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || sorcPoints.system.uses.value < 2) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.system.activation.type === 'action');
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 2, plural: 's'}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 2});
    let newItem = selection.clone({'system.activation.type': 'bonus'}, {keepId: true});
    newItem.prepareData();
    newItem.prepareFinalAttributes();
    newItem.applyActiveEffects();
    await workflowUtils.syntheticItemRoll(newItem, Array.from(workflow.targets), {options: {configureDialog: true}, config: {consumeSpellSlot: true, consumeUsage: newItem.system.hasLimitedUses ? true : null}});
}
async function attackSeeking({trigger: {entity: item}, workflow}) {
    if (!workflow.targets.size || workflow.item.type !== 'spell') return;
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || sorcPoints.system.uses.value < 2) return;
    let attackTotal = workflow.attackTotal;
    if (Array.from(workflow.targets).every(i => i.actor?.system.attributes.ac.value <= attackTotal)) return;
    let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Dialog.Missed', {attackTotal, itemName: item.name + '(2 ' + sorcPoints.name + ')'}));
    if (!selection) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 2});
    let newAttackRoll = await new Roll(workflow.attackRoll.formula, workflow.attackRoll.data, workflow.attackRoll.options).evaluate();
    await workflow.setAttackRoll(newAttackRoll);
}
async function useSubtle({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || sorcPoints.system.uses.value < 1) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    // including verbal just in case
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => ['vocal', 'verbal', 'somatic'].some(j => i.system.properties.has(j)));
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 1, plural: ''}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 1});
    let newItem = selection.clone({'system.properties': Array.from(selection.system.properties.difference(new Set(['vocal', 'verbal', 'somatic'])))}, {keepId: true});
    newItem.prepareData();
    newItem.prepareFinalAttributes();
    newItem.applyActiveEffects();
    await workflowUtils.syntheticItemRoll(newItem, Array.from(workflow.targets), {options: {configureDialog: true}, config: {consumeSpellSlot: true, consumeUsage: newItem.system.hasLimitedUses ? true : null}});
}
async function useTransmuted({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || sorcPoints.system.uses.value < 1) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let damageTypes = ['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder'];
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => damageTypes.some(j => i.system.damage?.parts?.some(k => k[0].includes(j) || k[1] === j)));
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 1, plural: ''}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - 1});
    let replacementOptions = selection.system.damage.parts.map(i => i[1]).filter(j => damageTypes.includes(j));
    let damageTypeToChange;
    if (replacementOptions.length > 1) {
        let selection2 = await dialogUtils.buttonDialog(selection.name, 'CHRISPREMADES.Macros.Metamagic.TransmutedFirst', replacementOptions.map(i => ['DND5E.Damage' + i.capitalize(), i]));
        if (selection2) damageTypeToChange = selection2;
    }
    if (!damageTypeToChange) damageTypeToChange = replacementOptions[0];
    let newDamageTypes = damageTypes.filter(i => i !== damageTypeToChange);
    let newDamageType = await dialogUtils.buttonDialog(selection.name, 'CHRISPREMADES.Macros.Metamagic.TransmutedSecond', newDamageTypes.map(i => ['DND5E.Damage' + i.capitalize(), i]));
    if (!newDamageType) newDamageType = newDamageTypes[0];
    let newDamageParts = [];
    for (let damageParts of selection.system.damage.parts) {
        if (damageParts[1] === damageTypeToChange) {
            newDamageParts.push([damageParts[0], newDamageType]);
        } else {
            newDamageParts.push(damageParts);
        }
    }
    let newItem = selection.clone({'system.damage.parts': newDamageParts}, {keepId: true});
    await workflowUtils.completeItemUse(newItem);
}
async function useTwinned({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    if (!sorcPoints || !sorcPoints.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NotEnough', 'info');
        return;
    }
    let validSpells = actorUtils.getCastableSpells(workflow.actor).filter(i => i.system.target.value === 1 && !i.system.target.units?.length && i.system.level <= sorcPoints.system.uses.value);
    if (!validSpells.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.NoValid', 'info');
    }
    validSpells = validSpells.sort((a, b) => a.name.localeCompare(b.name, 'en', {sensitivity: 'base'}));
    validSpells = validSpells.sort((a, b) => a.system.level - b.system.level);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, genericUtils.format('CHRISPREMADES.Macros.Metamagic.Which', {cost: 'spell\'s level in', plural: 's (at least 1)'}), validSpells, {
        addNoneDocument: true
    });
    if (!selection) return;
    let existingMacro = selection.flags?.['chris-premades']?.macros?.midi?.item ?? [];
    existingMacro.push('twinnedSpellAttack');
    let newItem = selection.clone({'system.target.value': 2, 'flags.chris-premades.macros.midi.item': existingMacro}, {keepId: true});
    newItem.prepareData();
    newItem.prepareFinalAttributes();
    newItem.applyActiveEffects();
    workflowUtils.syntheticItemRoll(newItem, Array.from(workflow.targets), {options: {configureDialog: true}, config: {consumeSpellSlot: true, consumeUsage: newItem.system.hasLimitedUses ? true : null}});
}
async function earlyTwinned({workflow}) {
    let sorcPoints = itemUtils.getItemByIdentifier(workflow.actor, 'sorceryPoints');
    let cost = Math.max(1, workflow.spellLevel);
    if (!sorcPoints || cost > sorcPoints.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Macros.Metamagic.TwinnedUpcast', 'info');
        // Give back spell slot if needed
        if (workflow.dnd5eConsumptionConfig?.consumeSpellSlot) {
            let slotLevel = workflow.dnd5eConsumptionConfig.slotLevel;
            let key = 'system.spells.' + slotLevel + '.value';
            let currValue = genericUtils.getProperty(workflow.actor, key);
            await genericUtils.update(workflow.actor, {[key]: currValue + 1});
        }
        workflow.aborted = true;
        return;
    }
    await genericUtils.update(sorcPoints, {'system.uses.value': sorcPoints.system.uses.value - cost});
}
export let carefulSpell = {
    name: 'Metamagic: Careful Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useCareful,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: earlyCareful,
                priority: 50
            }
        ]
    }
};
export let distantSpell = {
    name: 'Metamagic: Distant Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useDistant,
                priority: 50
            }
        ]
    }
};
// export let empoweredSpell = {
//     name: 'Metamagic: Empowered Spell',
//     version: '0.12.58'
// };
export let extendedSpell = {
    name: 'Metamagic: Extended Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useExtended,
                priority: 50
            }
        ]
    }
};
export let heightenedSpell = {
    name: 'Metamagic: Heightened Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useHeightened,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: earlyHeightened,
                priority: 50
            }
        ]
    }
};
export let quickenedSpell = {
    name: 'Metamagic: Quickened Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useQuickened,
                priority: 50
            }
        ]
    }
};
export let seekingSpell = {
    name: 'Metamagic: Seeking Spell',
    version: '0.12.58',
    midi: {
        actor: [
            {
                pass: 'postAttackRoll',
                macro: attackSeeking,
                priority: 50
            }
        ]
    }
};
export let subtleSpell = {
    name: 'Metamagic: Subtle Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useSubtle,
                priority: 50
            }
        ]
    }
};
export let transmutedSpell = {
    name: 'Metamagic: Transmuted Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useTransmuted,
                priority: 50
            }
        ]
    }
};
export let twinnedSpell = {
    name: 'Metamagic: Twinned Spell',
    version: '0.12.58',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: useTwinned,
                priority: 50
            }
        ]
    }
};
export let twinnedSpellAttack = {
    name: 'Metamagic: Twinned Spell Attack',
    version: twinnedSpell.version,
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: earlyTwinned,
                priority: 50
            }
        ]
    }
};