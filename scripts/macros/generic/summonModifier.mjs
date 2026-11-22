import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, queryUtils} from '../../proxy.mjs';
async function preCreate({document, actor, summon, updates}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summonModifier', configKeys);
    if (!config.effect && !config.magicalWeapons && !config.items.length) return;
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
            return data;
        });
        updates.items ??= sourceActor.items.map(item => item.toObject());
        updates.items.push(...itemData);
    }
    if (!config.magicalWeapons) return;
    updates.items ??= sourceActor.items.map(item => item.toObject());
    updates.items.forEach(itemData => {
        if (!Object.values(itemData.system.activities ?? {}).some(activityData => activityData.damage?.parts?.length)) return;
        if (!itemData.system.properties?.includes('mgc')) itemData.system.properties?.push('mgc');
    });
}
/**
 * Adds an effect, items or the magical property on damaging items to summons as they are created. Only summons that
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
