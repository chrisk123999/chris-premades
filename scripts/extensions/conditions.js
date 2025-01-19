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
    CONFIG.statusEffects.forEach(i => {
        if (i.customStatus) return;
        if (icons[i.id] && i.img != icons[i.id].img) i.img = icons[i.id];
    });
}
async function configureStatusEffectIcons() {
    let icons = genericUtils.getCPRSetting('statusEffectIcons');
    let inputs = CONFIG.statusEffects.filter(k => !k.customStatus).map(i => ({
        label: i.name,
        name: i.id,
        options: {
            type: 'image',
            currentValue: icons[i.id] ?? CONFIG.statusEffects.find(j => j.id === i.id)?.img ?? ''
        }
    }));
    let selection = await DialogApp.dialog('CHRISPREMADES.Settings.statusEffectIcons.Name', '', [['filePicker', inputs, {displayAsRows: true}]], 'okCancel', {id: 'cpr-status-effect-config', width: 500, height: 800});
    if (!selection) return;
    await genericUtils.setCPRSetting('statusEffectIcons', selection);
}
let ignoredStatusEffects = [
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
    'dodging'
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
    if (genericUtils.getCPRSetting('applyConditionChanges') && statusId) {
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
                            value: 'getDistance(workflow.rangeDetails?.attackingToken ?? workflow.token,workflow.targets.first()) <= 5',
                            priority: 20
                        },
                        {
                            key: 'flags.midi-qol.grants.disadvantage.attack.all',
                            mode: 0,
                            value: 'getDistance(workflow.rangeDetails?.attackingToken ?? workflow.token,workflow.targets.first()) > 5',
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
                            mode: 0,
                            value: '*0.5',
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
                            key: 'flags.midi-qol.grants.critical.range',
                            mode: 5,
                            value: 5,
                            priority: 20
                        }
                    );
                    return;
            }
        });
    }
    if (!changes.length && !removeStatuses.length) return;
    let sourceUpdates = {
        changes: (updates.changes ?? []).concat(changes),
        statuses: updates.statuses.filter(i => !removeStatuses.includes(i))
    };
    if (splitConditions) genericUtils.setProperty(sourceUpdates, 'flags.chris-premades.conditions', removeStatuses);
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
