import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, queryUtils} from '../../../../../proxy.mjs';
const terrains = ['arctic', 'coast', 'desert', 'forest', 'grassland', 'mountain', 'swamp'];
async function attune(item, activity, actor) {
    const identifier = documentUtils.getIdentifier(activity);
    const spellIdentifiers = automationUtils.getConfigValue(item, identifier) ?? [];
    if (!spellIdentifiers.length) return;
    const levels = (itemUtils.getAdvancementSourceItem(item) ?? actor.classes.wizard)?.system?.levels;
    if (!levels) return;
    const maxLevel = Math.min(9, Math.ceil(levels / 2));
    const spellDatas = (await Promise.all(spellIdentifiers.map(async spellIdentifier => {
        const document = await automationUtils.getSourceDocumentByIdentifier(spellIdentifier, 'Spell');
        if (!document) return;
        if (document.system.level > maxLevel) return;
        const data = document.toObject();
        genericUtils.setProperty(data, 'system.method', 'spell');
        genericUtils.setProperty(data, 'system.prepared', 2);
        genericUtils.setProperty(data, 'flags.chris-premades.naturalAttunement.leyline', true);
        genericUtils.setProperty(data, 'flags.tidy5e-sheet.section', item.name);
        return data;
    }))).filter(i => i);
    if (!spellDatas.length) {
        genericUtils.notify(_loc('CHRISPREMADES.Macros.Legacy.NaturalAttunement.NoSpells', {terrain: activity.name}), {type: 'warn', localize: false});
        return;
    }
    const sourceEffect = activity.effects[0]?.effect;
    if (!sourceEffect) return;
    const existing = actorUtils.getEffectByIdentifier(actor, 'natural-attunement');
    if (existing) await documentUtils.deleteDocument(existing);
    const effectData = documentUtils.getEffectData(activity, sourceEffect.id, {macros: [{type: 'effect', macros: [{source: 'chris-premades', rules: '2014', identifier: 'natural-attunement-effect'}]}]});
    genericUtils.setProperty(effectData, 'flags.chris-premades.naturalAttunement', identifier);
    const effect = (await effectUtils.createEffects(actor, [effectData]))[0];
    const items = await documentUtils.createEmbeddedDocuments(actor, 'Item', spellDatas);
    await documentUtils.makeDependent(effect, items);
    const links = items.map(spell => '@UUID[' + spell.uuid + ']{' + spell.name + '}').join(', ');
    await documentUtils.setDescriptionBlock(item, '<p><b>' + _loc('CHRISPREMADES.Macros.Legacy.NaturalAttunement.ChosenTerrain') + ':</b> ' + activity.name + '</p><p><b>' + _loc('CHRISPREMADES.Macros.Legacy.NaturalAttunement.Spells') + ':</b> ' + links + '</p>');
}
async function use({workflow}) {
    if (!terrains.includes(documentUtils.getIdentifier(workflow.activity))) return;
    await attune(workflow.item, workflow.activity, workflow.actor);
}
async function longRest({document: item}) {
    if (!automationUtils.getConfigValue(item, 'promptOnLongRest')) return;
    const actor = item.actor;
    if (!actor) return;
    const buttons = terrains.map(terrain => {
        const activity = itemUtils.getActivityByIdentifier(item, terrain);
        return activity ? [activity.name, terrain] : undefined;
    }).filter(i => i);
    if (!buttons.length) return;
    buttons.push(['DND5E.None', false]);
    const selection = await dialogUtils.buttonDialog(item.name, 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.SelectTerrain', buttons, {userId: queryUtils.firstOwner(actor, true)});
    if (!selection) return;
    const activity = itemUtils.getActivityByIdentifier(item, selection);
    if (activity) await attune(item, activity, actor);
}
async function effectDeleted({document: effect}) {
    const item = actorUtils.getItemByIdentifier(effect.parent, 'natural-attunement');
    if (!item) return;
    await documentUtils.setDescriptionBlock(item, '');
}
export const naturalAttunementEffect = {
    name: 'Natural Attunement: Effect',
    version: '2.0.0',
    rules: '2014',
    effect: [
        {
            pass: 'deleted',
            macro: effectDeleted,
            priority: 50
        }
    ]
};
export const naturalAttunement = {
    name: 'Natural Attunement',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: longRest,
            priority: 50
        }
    ],
    config: {
        promptOnLongRest: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.PromptOnLongRest',
            category: 'mechanics'
        },
        arctic: {
            default: ['grease', 'hold-person', 'slow', 'ice-storm', 'cone-of-cold'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Arctic',
            category: 'homebrew'
        },
        coast: {
            default: ['thunderwave', 'mirror-image', 'call-lightning', 'control-water', 'conjure-elemental'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Coast',
            category: 'homebrew'
        },
        desert: {
            default: ['color-spray', 'blur', 'daylight', 'blight', 'seeming'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Desert',
            category: 'homebrew'
        },
        forest: {
            default: ['entangle', 'barkskin', 'conjure-animals', 'shape-plants', 'tree-stride'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Forest',
            category: 'homebrew'
        },
        grassland: {
            default: ['elevated-sight', 'gust-of-wind', 'wind-wall', 'freedom-of-movement', 'commune-with-nature'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Grassland',
            category: 'homebrew'
        },
        mountain: {
            default: ['fog-cloud', 'silence', 'sleet-storm', 'stoneskin', 'wall-of-stone'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Mountain',
            category: 'homebrew'
        },
        swamp: {
            default: ['veil-of-dusk', 'spike-growth', 'stinking-cloud', 'giant-insect', 'insect-plague'],
            type: 'selectIdentifiers',
            label: 'CHRISPREMADES.Macros.Legacy.NaturalAttunement.Swamp',
            category: 'homebrew'
        }
    }
};
