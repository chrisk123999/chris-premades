import {Summons} from '../../lib/summons.js';
import {activityUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../utils.js';
async function use({workflow}) {
    await findSteedHelper(workflow, 'Steed', 'Steeds', 'findSteed'); 
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'findSteed');
    if (effect) await genericUtils.remove(effect);
}
async function early({workflow}) {
    await findSteedEarlyHelper(workflow, 'findSteed');
}
export async function findSteedHelper(workflow, defaultNameSuffix, defaultFolder, identifier) {
    let folder = itemUtils.getConfig(workflow.item, 'folder');
    if (!folder || !folder.length) folder = defaultFolder;
    let actors = game.actors.filter(i => i.folder?.name === folder);
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'findSteedDismiss', {strict: true});
    if (!feature) return;
    if (!actors.length) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Error.NoActors', {folder}), 'warn', {localize: false});
        return;
    }
    let sourceActor = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.FindSteed.Choose', actors);
    if (!sourceActor) return;
    let creatureButtons = [
        ['DND5E.CreatureCelestial', 'celestial'],
        ['DND5E.CreatureFey', 'fey'],
        ['DND5E.CreatureFiend', 'fiend']
    ];
    let creatureType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.FindSteed.Type', creatureButtons);
    if (!creatureType) return;
    let input = {
        label: 'DND5E.Languages',
        name: 'languageSelected',
        options: {
            options: Array.from(workflow.actor.system.traits.languages.value).map(i => {return {value: i, label: 'DND5E.Languages' + i.capitalize()};})
        }
    };
    let languageSelected = await dialogUtils.selectDialog(workflow.item.name, 'CHRISPREMADES.Macros.FindSteed.Language', input);
    if (!languageSelected) return;
    let sourceActorInt = Math.max(sourceActor.system.abilities.int.value, 6);
    let name = itemUtils.getConfig(workflow.item, 'steedName');
    if (!name || !name.length) name = sourceActor.name + ' ' + defaultNameSuffix;
    let updates = {
        actor: {
            name,
            system: {
                abilities: {
                    int: {
                        value: sourceActorInt
                    }
                },
                details: {
                    type: {
                        value: creatureType
                    }
                },
                traits: {
                    languages: languageSelected
                }
            },
            prototypeToken: {
                name
            }
        },
        token: {
            name,
            disposition: workflow.token.document.disposition
        }
    };
    let animation = itemUtils.getConfig(workflow.item, creatureType + 'Animation') ?? 'none';
    await Summons.spawn(sourceActor, updates, workflow.item, workflow.token, {
        duration: 86400, 
        range: 30, 
        animation, 
        dismissActivity: feature,
        unhideActivities: {
            itemUuid: workflow.item.uuid,
            activityIdentifiers: ['findSteedDismiss'],
            favorite: true
        }
    });
    let effect = await effectUtils.getEffectByIdentifier(workflow.actor, identifier);
    if (!effect) return;
    await genericUtils.setFlag(effect, 'chris-premades', 'macros.midi.actor', [identifier + 'Active']);
}
export async function findSteedEarlyHelper(workflow, identifier) {
    if (workflow.item.type !== 'spell') return;
    if (workflow.targets.size !== 1) return;
    if (workflow.targets.first().id !== workflow.token.id) return;
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, identifier);
    if (!effect) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let [steedId] = effect.flags['chris-premades']?.summons.ids[originItem.name] ?? [undefined];
    let steedToken = canvas.scene.tokens.get(steedId);
    if (!steedToken) return;
    if (tokenUtils.getDistance(workflow.token, steedToken) > 5) return;
    let selection = await dialogUtils.confirm(originItem.name, 'CHRISPREMADES.Macros.FindSteed.Target');
    if (selection) genericUtils.updateTargets([workflow.token, steedToken]);
}
async function veryEarly({dialog}) {
    dialog.configure = false;
}
export let findSteed = {
    name: 'Find Steed',
    version: '1.1.0',
    hasAnimation: true,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['findSteed']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['findSteedDismiss']
            },
            {
                pass: 'preTargeting',
                macro: veryEarly,
                priority: 50,
                activities: ['findSteedDismiss']
            }
        ]
    },
    config: [
        {
            value: 'steedName',
            label: 'CHRISPREMADES.Summons.CustomName',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.Steed',
            type: 'text',
            default: '',
            category: 'summons'
        },
        {
            value: 'folder',
            label: 'CHRISPREMADES.Summons.Folder',
            type: 'text',
            default: 'Steeds',
            category: 'summons'
        },
        {
            value: 'celestialAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Celestial',
            type: 'select',
            default: 'celestial',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'feyAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fey',
            type: 'select',
            default: 'nature',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
        {
            value: 'fiendAnimation',
            label: 'CHRISPREMADES.Config.SpecificAnimation',
            i18nOption: 'Fiend',
            type: 'select',
            default: 'fire',
            category: 'animation',
            options: constants.summonAnimationOptions
        },
    ]
};
export let findSteedActive ={
    name: 'Find Steed: Active',
    version: findSteed.version,
    midi: {
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 20
            }
        ]
    }
};