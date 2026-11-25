import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, genericUtils, queryUtils} from '../../proxy.mjs';
const formulaKeys = ['healing.bonus', 'healing.custom.formula'];
export function sourceItemType(item) {
    if (item && automationUtils.getConfigValue(item, 'spellSummon')) return 'spell';
    return item?.type;
}
function resolveOwnerFormulas(itemData, rollData) {
    for (const activityData of Object.values(itemData.system.activities ?? {})) {
        for (const key of formulaKeys) {
            const formula = genericUtils.getProperty(activityData, key);
            if (formula) genericUtils.setProperty(activityData, key, Roll.replaceFormulaData(formula, rollData));
        }
        for (const part of activityData.damage?.parts ?? []) {
            if (part.bonus) part.bonus = Roll.replaceFormulaData(part.bonus, rollData);
            if (part.custom?.formula) part.custom.formula = Roll.replaceFormulaData(part.custom.formula, rollData);
        }
    }
}
async function preCreate({document, actor, summon, updates}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summonModifier', configKeys);
    if (!config.effect && !config.magicalWeapons && !config.items.length && !config.hpPerHitDie) return;
    if (config.sourceItemTypes.length && !config.sourceItemTypes.includes(sourceItemType(summon.sourceItem))) return;
    if (config.sourceIdentifiers.length) {
        const source = summon.sourceDocument;
        if (!source || !config.sourceIdentifiers.includes(documentUtils.getIdentifier(source.item ?? source))) return;
    }
    const sourceActor = await summon.getSourceActor();
    if (config.creatureTypes.length && !config.creatureTypes.includes(actorUtils.typeOrRace(sourceActor))) return;
    if (config.confirm) {
        const selection = await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Generic.SummonModifier.Confirm.Prompt', {document: document.name, summon: sourceActor.name}), {userId: queryUtils.firstOwner(actor, true)});
        if (!selection) return;
    }
    const effectData = documentUtils.getEffectData(document, config.effect);
    if (effectData) {
        updates.effects ??= sourceActor.effects.map(effect => effect.toObject());
        updates.effects.push(effectData);
    }
    if (config.items.length) {
        const itemData = (await Promise.all(config.items.map(uuid => fromUuid(uuid)))).filter(Boolean).map(item => {
            const data = item.toObject();
            delete data._id;
            if (config.ownerFormulas) resolveOwnerFormulas(data, document.getRollData());
            return data;
        });
        updates.items ??= sourceActor.items.map(item => item.toObject());
        updates.items.push(...itemData);
    }
    if (config.hpPerHitDie) {
        const dice = Number(sourceActor.system.attributes.hp.formula?.match(/(\d+)\s*d\s*\d+/)?.[1] ?? 0);
        if (dice) {
            const max = (genericUtils.getProperty(updates, 'system.attributes.hp.max') ?? sourceActor.system.attributes.hp.max) + dice * config.hpPerHitDie;
            genericUtils.setProperty(updates, 'system.attributes.hp.max', max);
            genericUtils.setProperty(updates, 'system.attributes.hp.value', max);
        }
    }
    if (!config.magicalWeapons) return;
    updates.items ??= sourceActor.items.map(item => item.toObject());
    updates.items.forEach(itemData => {
        const naturalWeapon = itemData.type === 'weapon' && itemData.system.type?.value === 'natural';
        const monsterAttack = itemData.type === 'feat' && Object.values(itemData.system.activities ?? {}).some(activity => activity.attack?.type?.classification === 'weapon');
        if (!naturalWeapon && !monsterAttack) return;
        itemData.system.properties ??= [];
        if (!itemData.system.properties.includes('mgc')) itemData.system.properties.push('mgc');
    });
}
/**
 * Adds an effect, items, hit points per hit die or the magical property on damaging items to summons as they are created. Only summons that
 * match the source and creature type filters are changed.
 */
export const summonModifier = {
    rules: 'all',
    version: '2.1.11',
    category: 'summons',
    generic: true,
    documents: ['item'],
    summon: [
        {
            pass: 'actorPreCreate',
            macro: preCreate,
            priority: 50
        }
    ],
    genericConfig: {
        sourceIdentifiers: {
            default: [],
            type: 'selectIdentifiers',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Identifiers',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.SourceIdentifiers.Hint'
        },
        sourceItemTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SummonModifier.SourceItemTypes.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.SourceItemTypes.Hint',
            get options() { return constants.usableItemTypes; }
        },
        creatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.CreatureTypes.Hint',
            get options() { return constants.creatureTypeOptions; }
        },
        effect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Effect',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.Effect.Hint'
        },
        items: {
            default: [],
            type: 'documents',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SummonModifier.Items.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.Items.Hint'
        },
        ownerFormulas: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SummonModifier.OwnerFormulas.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.OwnerFormulas.Hint'
        },
        hpPerHitDie: {
            default: 0,
            type: 'number',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.SummonModifier.HpPerHitDie.Label',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.HpPerHitDie.Hint'
        },
        magicalWeapons: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Generic.Common.Magical',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.MagicalWeapons.Hint'
        },
        confirm: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.Confirm.Hint'
        }
    }
};
const configKeys = Object.keys(summonModifier.genericConfig);
