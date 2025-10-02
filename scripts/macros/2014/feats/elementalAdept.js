import {actorUtils, constants, effectUtils, genericUtils, itemUtils, rollUtils} from '../../../utils.js';
async function damage({trigger: {entity: item}, workflow}) {
    if (!workflow.damageRolls || !workflow.actor || !workflow.item) return;
    if (itemUtils.getConfig(item, 'spellOnly')) {
        if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellFeature')) return;
    }
    let validTypes = itemUtils.getConfig(item, 'damageTypes');
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        if (!validTypes.includes(roll.options.type)) return roll;
        let newFormula = '';
        for (let i of roll.terms) {
            if (i.isDeterministic) {
                newFormula += i.expression;
            } else if (i.expression.toLowerCase().includes('min2')) {
                newFormula += i.formula;
            } else if (i.flavor) {
                newFormula += i.expression + 'min2[' + i.flavor + ']';
            } else {
                newFormula += i.expression + 'min2';
            }
        }
        return await rollUtils.damageRoll(newFormula, workflow.activity, roll.options);
    }));
    await workflow.setDamageRolls(damageRolls);
    if (!workflow.targets.size) return;
    let mode = itemUtils.getConfig(item, 'mode');
    switch (mode) {
        case 'none': return;
        case 'ignoreResistance': {
            let effectData = {
                name: item.name,
                img: item.img,
                origin: item.uuid,
                duration: {
                    seconds: 1
                },
                changes: validTypes.map(i => ({
                    key: 'system.traits.idr.value',
                    mode: 2,
                    value: i
                })),
                flags: {
                    'chris-premades': {
                        effect: {
                            noAnimation: true
                        }
                    }
                }
            };
            await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'elementalAdeptEffect'});
            break;
        }
        case 'ignoreImmunity': {
            let effectData = {
                name: item.name,
                img: item.img,
                origin: item.uuid,
                duration: {
                    seconds: 1
                },
                changes: validTypes.map(i => ({
                    key: 'system.traits.idi.value',
                    mode: 2,
                    value: i
                })).concat(validTypes.map(i => ({
                    key: 'system.traits.idr.value',
                    mode: 2,
                    value: i
                }))),
                flags: {
                    'chris-premades': {
                        effect: {
                            noAnimation: true
                        }
                    }
                }
            };
            await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'elementalAdeptEffect'});
            break;
        }
        case 'ignoreResistanceImmunity': {
            let effectData = {
                name: item.name,
                img: item.img,
                origin: item.uuid,
                duration: {
                    seconds: 1
                },
                changes: validTypes.map(i => ({
                    key: 'system.traits.idi.value',
                    mode: 2,
                    value: i
                })).concat(validTypes.map(i => ({
                    key: 'system.traits.idr.value',
                    mode: 2,
                    value: i
                }))),
                flags: {
                    'chris-premades': {
                        effect: {
                            noAnimation: true
                        }
                    }
                }
            };
            await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'elementalAdeptEffect'});
            break;
        }
        case 'downgradeImmunity': {
            await Promise.all(workflow.targets.map(async token => {
                let downgrades = Array.from(token.actor.system.traits.di.value);
                let effectData = {
                    name: item.name,
                    img: item.img,
                    origin: item.uuid,
                    duration: {
                        seconds: 1
                    },
                    changes: downgrades.map(i => ({
                        key: 'system.traits.di.value',
                        mode: 2,
                        value: '-' + i
                    })).concat(downgrades.map(i => ({
                        key: 'system.traits.dr.value',
                        mode: 2,
                        value: i
                    }))),
                    flags: {
                        'chris-premades': {
                            effect: {
                                noAnimation: true
                            }
                        }
                    }
                };
                await effectUtils.createEffect(token.actor, effectData, {identifier: 'elementalAdeptEffect'});
            }));
            break;
        }
        case 'downgradeResistanceImmunity': {
            await Promise.all(workflow.targets.map(async token => {
                let downgradeImmunity = Array.from(token.actor.system.traits.di.value);
                let downgradeResistance = Array.from(token.actor.system.traits.dr.value).filter(i => !downgradeImmunity.includes(i));
                let effectData = {
                    name: item.name,
                    img: item.img,
                    origin: item.uuid,
                    duration: {
                        seconds: 1
                    },
                    changes: downgradeImmunity.map(i => ({
                        key: 'system.traits.di.value',
                        mode: 2,
                        value: '-' + i
                    })).concat(downgradeImmunity.map(i => ({
                        key: 'system.traits.dr.value',
                        mode: 2,
                        value: i
                    }))).concat(downgradeResistance.map(i => ({
                        key: 'system.traits.dr.value',
                        mode: 2,
                        value: '-' + i
                    }))),
                    flags: {
                        'chris-premades': {
                            effect: {
                                noAnimation: true
                            }
                        }
                    }
                };
                await effectUtils.createEffect(token.actor, effectData, {identifier: 'elementalAdeptEffect'});
            }));
            break;
        }
    }
}
async function done({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let effectIds = effectUtils.getAllEffectsByIdentifier(workflow.actor, 'elementalAdeptEffect').map(i => i.id);
    if (effectIds.length) await genericUtils.deleteEmbeddedDocuments(workflow.actor, 'ActiveEffect', effectIds);
    await Promise.all(workflow.targets.map(async token => {
        let effectIds = effectUtils.getAllEffectsByIdentifier(token.actor, 'elementalAdeptEffect').map(i => i.id);
        if (effectIds.length) await genericUtils.deleteEmbeddedDocuments(token.actor, 'ActiveEffect', effectIds);
    }));
}
let configMode = {
    value: 'mode',
    label: 'CHRISPREMADES.Macros.ElementalAdept.Mode',
    type: 'select',
    default: 'ignoreResistance',
    category: 'homebrew',
    homebrew: true,
    options: [
        {
            label: 'CHRISPREMADES.Macros.ElementalAdept.IgnoreResistance',
            value: 'ignoreResistance'
        },
        {
            label: 'CHRISPREMADES.Macros.ElementalAdept.IgnoreImmunity',
            value: 'ignoreImmunity'
        },
        {
            label: 'CHRISPREMADES.Macros.ElementalAdept.IgnoreResistanceImmunity',
            value: 'ignoreResistanceImmunity'
        },
        {
            label: 'CHRISPREMADES.Macros.ElementalAdept.DowngradeImmunity',
            value: 'downgradeImmunity'
        },
        {
            label: 'CHRISPREMADES.Macros.ElementalAdept.DowngradeResistanceImmunity',
            value: 'downgradeResistanceImmunity'
        },
    ]
};
let spellOnly = {
    value: 'spellOnly',
    label: 'CHRISPREMADES.Macros.ElementalAdept.SpellOnly',
    type: 'checkbox',
    default: true,
    category: 'homebrew',
    homebrew: true
};
export let elementalAdeptA = {
    name: 'Elemental Adept (Acid)',
    version: '1.1.0',
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 320
            },
            {
                pass: 'rollFinished',
                macro: done,
                priority: 320
            }
        ]
    },
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        spellOnly,
        configMode
    ]
};
export let elementalAdeptC = {
    name: 'Elemental Adept (Cold)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['cold'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        spellOnly,
        configMode
    ]
};
export let elementalAdeptF = {
    name: 'Elemental Adept (Fire)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['fire'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        spellOnly,
        configMode
    ]
};
export let elementalAdeptL = {
    name: 'Elemental Adept (Lightning)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['lightning'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        spellOnly,
        configMode
    ]
};
export let elementalAdeptT = {
    name: 'Elemental Adept (Thunder)',
    version: elementalAdeptA.version,
    midi: elementalAdeptA.midi,
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['thunder'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        },
        spellOnly,
        configMode
    ]
};