import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, queryUtils} from '../../proxy.mjs';
async function preCreate({document, actor, summon, updates}) {
    const config = automationUtils.getGenericConfigValues(document, 'chris-premades', 'summonModifier', configKeys);
    if (!config.effect && !config.magicalWeapons) return;
    if (config.sourceIdentifiers.length) {
        const source = summon.sourceDocument;
        if (!source || !config.sourceIdentifiers.includes(documentUtils.getIdentifier(source.item ?? source))) return;
    }
    const sourceActor = await summon.getSourceActor();
    if (config.creatureTypes.length && !config.creatureTypes.includes(actorUtils.typeOrRace(sourceActor))) return;
    if (config.confirm) {
        const selection = await dialogUtils.confirm(document.name, _loc('CHRISPREMADES.Macros.Generic.SummonModifier.Confirm', {document: document.name, summon: sourceActor.name}), {userId: queryUtils.firstOwner(actor, true)});
        if (!selection) return;
    }
    const effectData = documentUtils.getEffectData(document, config.effect);
    if (effectData) {
        updates.effects ??= sourceActor.effects.map(effect => effect.toObject());
        updates.effects.push(effectData);
    }
    if (!config.magicalWeapons) return;
    updates.items ??= sourceActor.items.map(item => item.toObject());
    updates.items.forEach(itemData => {
        if (!Object.values(itemData.system.activities ?? {}).some(activityData => activityData.damage?.parts?.length)) return;
        if (!itemData.system.properties?.includes('mgc')) itemData.system.properties?.push('mgc');
    });
}
export const summonModifier = {
    rules: 'all',
    version: '2.0.0',
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
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.SourceIdentifiersHint'
        },
        creatureTypes: {
            default: [],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.CreatureTypes',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.CreatureTypesHint',
            get options() { return constants.creatureTypeOptions(); }
        },
        effect: {
            default: '',
            type: 'selectEffect',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Effect',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.EffectHint'
        },
        magicalWeapons: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.Magical',
            hint: 'CHRISPREMADES.Macros.Generic.SummonModifier.MagicalWeaponsHint'
        },
        confirm: {
            default: false,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.PromptToUse'
        }
    }
};
const configKeys = Object.keys(summonModifier.genericConfig);
