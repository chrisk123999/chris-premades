import {automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, folderUtils, genericUtils, summonUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
const srdSteeds = {
    'find-steed': ['warhorse', 'pony', 'camel', 'elk', 'mastiff'],
    'find-greater-steed': ['griffon', 'pegasus', 'dire-wolf', 'rhinoceros', 'saber-toothed-tiger']
};
const effectIdentifiers = {
    'find-steed': 'findSteed',
    'find-greater-steed': 'findGreaterSteed'
};
async function summon({workflow}) {
    const identifier = documentUtils.getIdentifier(workflow.item);
    const folder = automationUtils.getConfigValue(workflow.item, 'folder');
    const actors = folder ? await folderUtils.getActorsInFolder(folder) : await compendiumUtils.getDocumentsBySlug('dnd5e.monsters', srdSteeds[identifier] ?? []);
    if (!actors.length) {
        genericUtils.notify(_loc('CHRISPREMADES.Macros.Legacy.FindSteed.NoActors', {folder}), {type: 'warn', localize: false});
        return;
    }
    const sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.FindSteed.Choose', actors, {sort: 'alphabetical'});
    if (!sourceActor) return;
    const creatureType = automationUtils.getConfigValue(workflow.item, 'creatureType') || await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.FindSteed.Type', constants.spiritTypeOptions.map(option => [option.label, option.value, {image: option.image}]));
    if (!creatureType) return;
    const language = await dialogUtils.selectLanguage(workflow.actor, workflow.item.name, 'CHRISPREMADES.Macros.Legacy.FindSteed.Language');
    if (workflow.actor.system.traits.languages.value.size > 1 && !language) return;
    const updates = {
        system: {
            abilities: {int: {value: Math.max(sourceActor.system.abilities.int.value, 6)}},
            details: {type: {value: creatureType}},
            traits: {languages: {value: language ? [language] : []}}
        }
    };
    await Promise.all(summonUtils.getSummonsBySource(workflow.item).map(existing => summonUtils.deleteSummon(existing)));
    const steed = await summonUtils.createSummon(workflow.actor, sourceActor, {
        name: automationUtils.getConfigValue(workflow.item, 'name') || sourceActor.name,
        updates,
        animation: automationUtils.getConfigValue(workflow.item, creatureType + 'Animation'),
        sourceDocument: workflow.item,
        dismissAtZero: true
    });
    if (!steed) return;
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        identifier: effectIdentifiers[identifier] ?? 'findSteed',
        activityUuid: workflow.activity.uuid,
        unhideActivities: ['find-steed-dismiss'],
        favoriteActivities: true,
        macros: [
            {
                type: 'roll',
                macros: [
                    {
                        source: 'chris-premades',
                        rules: '2014',
                        identifier: 'find-steed-active'
                    }
                ]
            }
        ]
    });
    const [effect] = await effectUtils.createEffects(workflow.actor, [effectData]);
    if (effect) await documentUtils.makeDependent(steed.actor, [effect]);
    await steed.place(workflow.activity.range.value, {token: workflow.token.document});
}
async function dismiss({workflow}) {
    await Promise.all(summonUtils.getSummonsBySource(workflow.item).map(steed => summonUtils.deleteSummon(steed)));
}
async function shareSpell({document, workflow}) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.targets.size !== 1 || workflow.targets.first().id !== workflow.token?.id) return;
    const originActivity = await effectUtils.getOriginActivity(document);
    if (!originActivity) return;
    const steedToken = summonUtils.getSummonsBySource(originActivity.item).find(steed => steed.token)?.token;
    if (!steedToken) return;
    if (tokenUtils.getDistance(workflow.token.document, steedToken) > 5) return;
    const selection = await dialogUtils.confirm(originActivity.item.name, 'CHRISPREMADES.Macros.Legacy.FindSteed.Target');
    if (selection) await workflowUtils.updateTargets(workflow, [workflow.token, steedToken.object]);
}
const config = {
    name: {
        default: '',
        type: 'text',
        label: 'CHRISPREMADES.Config.CustomName',
        category: 'summons'
    },
    folder: {
        default: '',
        type: 'text',
        label: 'CHRISPREMADES.Macros.Legacy.FindSteed.Folder',
        hint: 'CHRISPREMADES.Macros.Legacy.FindSteed.FolderHint',
        category: 'summons'
    },
    creatureType: {
        default: '',
        type: 'select',
        label: 'CHRISPREMADES.Macros.Legacy.FindSteed.CreatureType',
        hint: 'CHRISPREMADES.Macros.Legacy.FindSteed.CreatureTypeHint',
        category: 'summons',
        get options() { return [{value: '', label: _loc('CHRISPREMADES.Macros.Legacy.FindSteed.Ask')}, ...constants.spiritTypeOptions]; }
    },
    celestialAnimation: {
        default: {source: 'chris-premades', identifier: 'celestialSummon'},
        type: 'selectAnimation',
        inputs: ['summon', 'location', 'token'],
        label: 'CHRISPREMADES.Config.Animation',
        category: 'animations'
    },
    feyAnimation: {
        default: {source: 'chris-premades', identifier: 'natureSummon'},
        type: 'selectAnimation',
        inputs: ['summon', 'location', 'token'],
        label: 'CHRISPREMADES.Config.Animation',
        category: 'animations'
    },
    fiendAnimation: {
        default: {source: 'chris-premades', identifier: 'fiendSummon'},
        type: 'selectAnimation',
        inputs: ['summon', 'location', 'token'],
        label: 'CHRISPREMADES.Config.Animation',
        category: 'animations'
    }
};
export const findSteed = {
    name: 'Find Steed',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: summon,
            priority: 50
        }
    ],
    config
};
export const findGreaterSteed = {...findSteed, name: 'Find Greater Steed', roll: findSteed.roll.map(pass => ({...pass}))};
export const findSteedDismiss = {
    name: 'Find Steed: Dismiss',
    version: findSteed.version,
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: dismiss,
            priority: 50
        }
    ]
};
export const findSteedActive = {
    name: 'Find Steed: Active',
    version: findSteed.version,
    rules: '2014',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: shareSpell,
            priority: 50
        }
    ]
};
