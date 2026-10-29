import {actorUtils, automationUtils, constants, DamageBonus, dataUtils, dialogUtils, documentUtils, genericUtils, Logging, rollUtils, workflowUtils} from '../../../../../proxy.mjs';
async function editRage({data, document: item, macroClass: {source}}) {
    const config = automationUtils.getConfigValues(item, Object.keys(giantsHavoc.config));
    config.giantBonus = (await rollUtils.rollDice(config.giantBonus, {document: item}))?.total;
    config.giantReach = (await rollUtils.rollDice(config.giantReach, {document: item}))?.total;
    if (typeof config.giantSize === 'string') config.giantSize = [config.giantSize];
    const existingConfig = data.effectData.flags[source]?.rage ?? {};
    genericUtils.setProperty(data.effectData, `flags.${source}.rage`, {...existingConfig, ...config});
    const macro = {source, rules: giantsHavoc.rules, identifier: 'giantRage'};
    if (data.effectData.flags.cat?.macros?.roll)
        data.effectData.flags.cat.macros.roll.push(macro);
    else 
        genericUtils.setProperty(data.effectData, 'flags.cat.macros.roll', [macro]);
}
async function increaseSizeReach({data, document: item, macroClass: {identifier, source}}) {
    const config = data.effect.flags[source]?.rage;
    if (!config.giantSize || !config.giantReach)
        return Logging.addMacroWarning(source, identifier, `Giant's Havoc is missing configs on the rage effect! (effect) ${data.effect.uuid}`);
    const currentSize = CONFIG.DND5E.actorSizes[actorUtils.getSize(item.actor, true)];
    const options = config.giantSize.filter(s => (CONFIG.DND5E.actorSizes[s]?.numerical ?? 0) > currentSize.numerical);
    let size = options[0];
    if (options.length === 1) {
        if (!await dialogUtils.confirm(
            item.name,
            _loc('CHRISPREMADES.Macros.Legacy.GiantsHavoc.PromptSingle', {size: CONFIG.DND5E.actorSizes[size]?.label ?? size})
        )) size = undefined;
    } else if (options.length > 1) {
        size = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Legacy.GiantsHavoc.PromptMany', [...options, null].map(o => ([
            CONFIG.DND5E.actorSizes[o]?.label || _loc('CAT.Config.None'), o
        ])));
    }
    if (size) {
        let changed = false;
        const changes = data.effect.system.changes;
        changes.push({key: 'system.traits.size', type: 'override', value: size});
        const {animation} = automationUtils.getResolvedAnimation(item, 'giantAnimation');
        const resize = async () => {
            if (changed) return;
            changed = true;
            await documentUtils.update(data.effect, {'system.changes': changes});
        };
        if (data.token && animation?.macros?.play) {
            animation.macros.play(data.token, {
                preScale: currentSize.dynamicTokenScale ?? 1,
                callback: resize,
                enlarge: true
            });
        } else await resize();
    }
    const weapons = item.actor.itemTypes.weapon.filter(w => ['simpleM', 'martialM', 'unarmed'].includes(w.system.type.value));
    if (!weapons.length) return Logging.addMacroWarning(source, identifier, `Giant's Havoc exited early with no valid weapons. (actor) ${item.actor.uuid}`);
    const enchant = {
        type: 'enchantment',
        name: item.name,
        img: item.img,
        flags: {dnd5e: {dependentOn: data.effect.uuid}},
        system: {changes: [{key: 'system.range.reach', type: 'add', value: config.giantReach}]}
    };
    dataUtils.setOrigin(enchant, item);
    await documentUtils.modifyBatch(weapons.map(w => {
        const enchantData = genericUtils.duplicate(enchant);
        genericUtils.setProperty(enchantData, 'system.changes.0.value', (w.system.range.reach || 5) + config.giantReach);
        return {
            documentName: 'ActiveEffect',
            action: 'create',
            data: [enchantData],
            parent: w
        };
    }));
}
async function giantDamage({document: effect, macroClass: {identifier, source}, workflow}) {
    if (!workflow.hitTargets.size) return;
    if (workflow.activity.ability !== 'str') return;
    if (!workflow.item.system.properties.has('thr')) return;
    if (!workflowUtils.isAttackType(workflow, 'rangedWeaponAttack')) return; 
    const formula = effect.flags[source]?.rage?.giantBonus;
    if (!formula) return Logging.addMacroWarning(source, identifier, `Giant's Havoc is missing a bonus formula on the rage effect! (effect) ${effect.uuid}`);
    return new DamageBonus(effect, {formula, optional: false});
}
export const giantsHavoc = {
    name: 'Giant\'s Havoc',
    version: '2.1.5',
    rules: '2014',
    called: [
        {
            pass: 'actorPreCreateRageEffect',
            macro: editRage,
            priority: 10 // demiurgic colossus makes other edits
        },
        {
            pass: 'actorRageBegin',
            macro: increaseSizeReach,
            priority: 190 // before instinctive pounce
        }
    ],
    config: {
        giantBonus: {
            default: '@scale.barbarian.rage-damage',
            type: 'text',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.DamageBonus'
        },
        giantReach: {
            default: '5',
            type: 'text',
            category: 'behavior',
            label: 'DND5E.ITEM.Property.Reach'
        },
        giantSize: {
            default: 'lg',
            type: 'select',
            category: 'behavior',
            label: 'DND5E.Size',
            get options() { return constants.sizeOptions; }
        },
        giantAnimation: {
            default: {
                source: 'chris-premades',
                identifier: 'enlargeReduce'
            },
            type: 'selectAnimation',
            category: 'animations',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation'
        }
    }
};
export const giantRage = {
    version: giantsHavoc.version,
    rules: giantsHavoc.rules,
    roll: [
        {
            pass: 'actorOptionalBonusDamage',
            macro: giantDamage,
            priority: 200
        }
    ]
};
