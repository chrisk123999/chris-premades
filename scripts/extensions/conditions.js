import {DialogApp} from '../applications/dialog.js';
import {actorUtils, effectUtils, genericUtils, socketUtils} from '../utils.js';
async function createActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    await genericUtils.sleep(50);
    await effectUtils.applyConditions(effect.parent, effectConditions);
}
async function deleteActiveEffect(effect, options, userId) {
    if (!socketUtils.isTheGM()) return;
    if (!(effect.parent instanceof Actor)) return;
    let effectConditions = effect.flags['chris-premades']?.conditions;
    if (!effectConditions) return;
    let ids = [];
    effectConditions.forEach(i => {
        let otherEffect = actorUtils.getEffects(effect.parent).find(j => j.id != effect.id && j.flags['chris-premades']?.conditions?.includes(i));
        if (otherEffect) return;
        let cEffect = effectUtils.getEffectByStatusID(effect.parent, i);
        if (cEffect) ids.push(cEffect.id);
    });
    if (ids.length) await effect.parent.deleteEmbeddedDocuments('ActiveEffect', ids);
}
function setStatusEffectIcons() {
    let icons = genericUtils.getCPRSetting('statusEffectIcons');
    let validStatusEffects = CONFIG.statusEffects.filter(k => !k.customStatus && !k.name?.startsWith('MonksLittleDetails'));
    validStatusEffects.forEach(i => {
        if (icons[i.id] && i.img !== icons[i.id]) i.img = icons[i.id];
    });
}
async function configureStatusEffectIcons() {
    let icons = genericUtils.getCPRSetting('statusEffectIcons');
    let validStatusEffects = CONFIG.statusEffects.filter(k => !k.customStatus && !k.name?.startsWith('MonksLittleDetails'));
    let inputs = validStatusEffects.map(i => ({
        label: i.name,
        name: i.id,
        options: {
            type: 'image',
            currentValue: icons[i.id] ?? validStatusEffects.find(j => j.id === i.id)?.img ?? ''
        }
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.statusEffectIcons.Name', '', [['filePicker', inputs, {displayAsRows: true}]], 'okCancel', {id: 'cpr-status-effect-config', width: 500, height: 800});
    if (!selection) return;
    await genericUtils.setCPRSetting('statusEffectIcons', selection);
}
let ignoredStatusEffects = [
    'bleeding',
    'burrowing',
    'cursed',
    'ethereal',
    'flying',
    'hovering',
    'marked',
    'sleeping',
    'transformed',
    'hiding',
    'stable',
    'surprised',
    'silenced',
    'dodging',
    'burning',
    'dehydration',
    'falling',
    'malnutrition',
    'suffocation'
];
function disableNonConditionStatusEffects() {
    CONFIG.statusEffects = CONFIG.statusEffects.filter(i => !ignoredStatusEffects.includes(i.id));
}
async function preCreateActiveEffect(effect, updates, options, userId) {
    if (game.user.id != userId) return;
    if (!updates.statuses || !updates.statuses.length) return;
    if (options?.['chris-premades']?.ignore) return;
    let splitConditions = genericUtils.getCPRSetting('displayNestedConditions');
    let statusId = CONFIG.statusEffects.find(i => i._id === updates._id)?.id;
    if (splitConditions && !statusId) return;
    let statuses = splitConditions ? [statusId] : updates.statuses;
    let removeStatuses = [];
    if (splitConditions) {
        updates.statuses.forEach(i => {
            if (i === statusId) return;
            removeStatuses.push(i);
        });
    }
    let changes = [];
    let invisibleMacro = false;
    if (genericUtils.getCPRSetting('applyConditionChanges') && statusId) {
        let feetToMeters = genericUtils.convertDistance(5) ;
        let rules = game.settings.get('dnd5e', 'rulesVersion');
        let removeMovement = false;
        statuses.forEach(i => {
            switch(i) {
                case 'blinded':
                    changes.push(
                        {
                            key: 'flags.midi-qol.disadvantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
                    return;
                case 'frightened':
                    changes.push(
                        {
                            key: 'flags.midi-qol.disadvantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.disadvantage.ability.check.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
                    return;
                case 'invisible':
                    if (rules === 'modern') {
                        invisibleMacro = true;
                        changes.push(
                            {
                                key: 'flags.dnd5e.initiativeAdv',
                                mode: 0,
                                value: 1,
                                priority: 20
                            }
                        );
                    } else {
                        changes.push(
                            {
                                key: 'flags.midi-qol.advantage.attack.all',
                                mode: 0,
                                value: 1,
                                priority: 20
                            },
                            {
                                key: 'flags.midi-qol.grants.disadvantage.attack.all',
                                mode: 0,
                                value: 1,
                                priority: 20
                            }
                        );
                    }
                    return;
                case 'paralyzed':
                    changes.push(
                        {
                            key: 'flags.midi-qol.fail.ability.save.dex',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.fail.ability.save.str',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.critical.range',
                            mode: 5,
                            value: 5,
                            priority: 20
                        }
                    );
                    removeMovement = true;
                    return;
                case 'petrified':
                    changes.push(
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.fail.ability.save.dex',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.fail.ability.save.str',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'system.traits.di.value',
                            mode: 2,
                            value: 'poison',
                            priority: 20
                        },
                        {
                            key: 'system.traits.dr.all',
                            mode: 0,
                            value: 'physical',
                            priority: 20
                        },
                        {
                            key: 'system.traits.dr.all',
                            mode: 0,
                            value: 'magical',
                            priority: 20
                        }
                    );
                    removeMovement = true;
                    return;
                case 'poisoned':
                    changes.push(
                        {
                            key: 'flags.midi-qol.disadvantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.disadvantage.ability.check.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
                    return;
                case 'prone':
                    changes.push(
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 'computeDistance(workflow.rangeDetails?.attackingToken ?? workflow.token, workflow.targets.first()) <= ' + feetToMeters,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.disadvantage.attack.all',
                            mode: 0,
                            value: 'computeDistance(workflow.rangeDetails?.attackingToken ?? workflow.token, workflow.targets.first()) > ' + feetToMeters,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.disadvantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'system.attributes.movement.walk',
                            mode: 1,
                            value: 0.5,
                            priority: 20
                        }
                    );
                    return;
                case 'restrained':
                    changes.push(
                        {
                            key: 'flags.midi-qol.disadvantage.ability.save.dex',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.disadvantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
                    removeMovement = true;
                    return;
                case 'grappled':
                    removeMovement = true;
                    return;
                case 'silenced':
                    changes.push(
                        {
                            key: 'flags.midi-qol.fail.spell.vocal',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
                    return;
                case 'stunned':
                    changes.push(
                        {
                            key: 'flags.midi-qol.fail.ability.save.dex',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.fail.ability.save.str',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
                    return;
                case 'dead':
                case 'unconscious':
                    changes.push(
                        {
                            key: 'flags.midi-qol.fail.ability.save.dex',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.fail.ability.save.str',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.advantage.attack.all',
                            mode: 0,
                            value: 1,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.critical.mwak',
                            mode: 0,
                            value: 'computeDistance(workflow.rangeDetails?.attackingToken ?? workflow.token, workflow.targets.first()) <= ' + feetToMeters,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.critical.rwak',
                            mode: 0,
                            value: 'computeDistance(workflow.rangeDetails?.attackingToken ?? workflow.token, workflow.targets.first()) <= ' + feetToMeters,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.critical.msak',
                            mode: 0,
                            value: 'computeDistance(workflow.rangeDetails?.attackingToken ?? workflow.token, workflow.targets.first()) <= ' + feetToMeters,
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.critical.rsak',
                            mode: 0,
                            value: 'computeDistance(workflow.rangeDetails?.attackingToken ?? workflow.token, workflow.targets.first()) <= ' + feetToMeters,
                            priority: 20
                        }
                    );
                    removeMovement = true;
                    return;
                case 'incapacitated':
                    if (rules != 'modern') return;
                    changes.push(
                        {
                            key: 'flags.dnd5e.initiativeDisadv',
                            mode: 0,
                            value: 1,
                            priority: 20
                        }
                    );
            }
        });
        if (removeMovement) {
            let movementNames = ['burrow', 'climb', 'fly', 'swim', 'walk'];
            movementNames.forEach(i => {
                changes.push(
                    {
                        key: 'system.attributes.movement.' + i,
                        mode: 3,
                        value: 0,
                        priority: 20
                    }
                );
            });
        }
    }
    if (!changes.length && !removeStatuses.length && !invisibleMacro) return;
    let sourceUpdates = {
        changes: (updates.changes ?? []).concat(changes),
        statuses: updates.statuses.filter(i => !removeStatuses.includes(i))
    };
    if (splitConditions) genericUtils.setProperty(sourceUpdates, 'flags.chris-premades.conditions', removeStatuses);
    if (invisibleMacro) {
        let actorMacros = updates?.flags?.['chris-premades']?.macros?.midi?.actor ?? [];
        actorMacros.push('invisible');
        genericUtils.setProperty(sourceUpdates, 'flags.chris-premades.macros.midi.actor', actorMacros);
        genericUtils.setProperty(sourceUpdates, 'flags.chris-premades.rules', 'modern');
    }
    effect.updateSource(sourceUpdates);
}
function disableSpecialEffects(enabled) {
    CONFIG.specialStatusEffects.BLIND = enabled ? null : 'blinded';
    CONFIG.specialStatusEffects.INVISIBLE = enabled ? null : 'invisible';
}
export let conditions = {
    createActiveEffect,
    deleteActiveEffect,
    setStatusEffectIcons,
    configureStatusEffectIcons,
    disableNonConditionStatusEffects,
    preCreateActiveEffect,
    disableSpecialEffects,
    ignoredStatusEffects
};