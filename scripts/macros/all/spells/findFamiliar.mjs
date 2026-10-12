import {actorUtils, automationUtils, compendiumUtils, constants, dialogUtils, documentUtils, effectUtils, folderUtils, itemUtils, Logging, summonUtils, tokenUtils} from '../../../proxy.mjs';
const srdFamiliars = ['bat', 'cat', 'crab', 'frog', 'hawk', 'lizard', 'octopus', 'owl', 'poisonous-snake', 'quipper', 'rat', 'raven', 'sea-horse', 'spider', 'weasel'];
async function preventRecast({document: activity}) {
    if (!summonUtils.getSummonsBySource(activity.item).length) return;
    Logging.addMacroWarning('CPR', documentUtils.getIdentifier(activity.item), 'A familiar is already summoned.');
    return true;
}
async function summon({workflow}) {
    const identifier = documentUtils.getIdentifier(workflow.item);
    const folder = automationUtils.getConfigValue(workflow.item, 'folder');
    const actors = folder ? await folderUtils.getActorsInFolder(folder) : await compendiumUtils.getDocumentsBySlug('dnd5e.monsters', srdFamiliars);
    if (!actors.length) {
        Logging.addMacroWarning('CPR', identifier, 'CHRISPREMADES.Macros.All.FindFamiliar.NoActors', {notify: 'warn', format: {folder}});
        return;
    }
    const sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.FindFamiliar.Choose', actors, {sort: 'alphabetical'});
    if (!sourceActor) return;
    const creatureType = automationUtils.getConfigValue(workflow.item, 'creatureType') || await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.All.FindFamiliar.Type', constants.spiritTypeOptions.map(option => [option.label, option.value, {image: option.image}]));
    if (!creatureType) return;
    const name = automationUtils.getConfigValue(workflow.item, 'name') || sourceActor.name;
    const updates = {system: {details: {type: {value: creatureType}}}};
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        name,
        updates,
        animation: automationUtils.getConfigValue(workflow.item, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        sourceDocument: workflow.item,
        identifier,
        dismissAtZero: true
    });
    if (!summon) return;
    const effect = await itemUtils.unhideActivities(workflow.item, ['find-familiar-pocket-dimension', 'find-familiar-touch', 'find-familiar-place'], {favorite: true});
    await documentUtils.makeDependent(summon.actor, [effect]);
    await summon.place(workflow.activity.range.value, {token: workflow.token.document});
}
async function pocket({workflow}) {
    const summons = summonUtils.getSummonsBySource(workflow.item);
    if (!summons.length) return Logging.addMacroWarning('CPR', 'find-familiar-pocket', 'No familiar summoned.');
    if (summons.find(i => i.token)) {
        await summonUtils.recallAllSourceSummons(workflow.item);
    } else {
        await summonUtils.placeAllSourceSummons(workflow.item, workflow.activity.range.value, {token: workflow.token.document});
    }
}
async function touch({document, workflow}) {
    const [summon] = summonUtils.getSummonsBySource(workflow.item);
    if (!summon) return Logging.addMacroWarning('CPR', 'find-familiar-touch', 'No familiar summoned.');
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name + ': ' + workflow.activity.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'findFamiliarTouch',
        duration: {value: 1, units: 'seconds'},
        specialDuration: ['1Attack'],
        macros: [
            {
                type: 'roll',
                macros: [
                    {
                        source: 'chris-premades',
                        rules: 'all',
                        identifier:
                        'find-familiar-touch-effect'
                    }
                ]
            }
        ],
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                type: 'custom',
                value: 1,
                priority: 20
            }
        ]
    });
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [effectData]);
    await effectUtils.createEffects(summon.actor, [effectData], {parentEntity: casterEffect});
}
async function early({document, workflow, token}) {
    if (workflow.item.type !== 'spell' || workflow.item.system.range.units !== 'touch') {
        Logging.addMacroWarning('CPR', 'find-familiar-touch-effect', 'CHRISPREMADES.Macros.All.FindFamiliar.InvalidSpell', {notify: 'info'});
        return true;
    }
    const originActivity = await effectUtils.getOriginActivity(document);
    const [summon] = summonUtils.getSummonsBySource(originActivity?.item);
    const familiarToken = summon?.token;
    if (!familiarToken) {
        Logging.addMacroWarning('CPR', 'find-familiar-touch-effect', 'CHRISPREMADES.Macros.All.FindFamiliar.TooFar', {notify: 'info'});
        return true;
    }
    const range = automationUtils.getConfigValue(originActivity.item, 'touchRange');
    if (tokenUtils.getDistance(token, familiarToken) > range) {
        Logging.addMacroWarning('CPR', 'find-familiar-touch-effect', 'CHRISPREMADES.Macros.All.FindFamiliar.TooFar', {notify: 'info'});
        return true;
    }
    if (actorUtils.hasUsedReaction(familiarToken.actor)) {
        Logging.addMacroWarning('CPR', 'find-familiar-touch-effect', 'CHRISPREMADES.Macros.All.FindFamiliar.ReactionUsed', {notify: 'info'});
        return true;
    }
    await actorUtils.setReactionUsed(familiarToken.actor);
}
export const findFamiliar = {
    name: 'Find Familiar',
    version: '2.0.4',
    rules: 'all',
    roll: [
        {
            pass: 'activityPreTargeting',
            macro: preventRecast,
            priority: 50
        },
        {
            pass: 'activityRollFinished',
            macro: summon,
            priority: 50
        }
    ],
    config: {
        name: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Config.CustomName',
            category: 'summons'
        },
        folder: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.Folder',
            category: 'summons'
        },
        creatureType: {
            default: '',
            type: 'select',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.CreatureType',
            hint: 'CHRISPREMADES.Macros.All.FindFamiliar.CreatureTypeHint',
            category: 'summons',
            get options() { return [{value: '', label: _loc('CHRISPREMADES.Macros.All.FindFamiliar.Ask')}, ...constants.spiritTypeOptions]; }
        },
        touchRange: {
            default: 100,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.FindFamiliar.TouchRange',
            category: 'homebrew'
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
    }
};
export const findFamiliarTouchEffect = {
    name: 'Find Familiar: Touch',
    version: findFamiliar.version,
    rules: 'all',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: early,
            priority: 50
        }
    ]
};
export const findFamiliarTouch = {
    name: 'Find Familiar: Touch',
    version: findFamiliar.version,
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: touch,
            priority: 50
        }
    ]
};
export const findFamiliarPocket = {
    name: 'Find Familiar: Pocket',
    version: findFamiliar.version,
    rules: 'all',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: pocket,
            priority: 50
        }
    ]
};
