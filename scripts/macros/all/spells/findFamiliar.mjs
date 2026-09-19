import {actorUtils, automationUtils, dialogUtils, documentUtils, effectUtils, genericUtils, summonUtils, tokenUtils} from '../../../proxy.mjs';
const familiarActivities = ['find-familiar-pocket-dimension', 'find-familiar-touch'];
function creatureTypeOptions() {
    return ['celestial', 'fey', 'fiend'].map(value => ({value, label: CONFIG.DND5E.creatureTypes[value].label}));
}
const srdFamiliars = ['bat', 'cat', 'crab', 'frog', 'hawk', 'lizard', 'octopus', 'owl', 'poisonous-snake', 'quipper', 'rat', 'raven', 'sea-horse', 'spider', 'weasel'];
async function srdActors() {
    const pack = game.packs.get('dnd5e.monsters');
    if (!pack) return [];
    const index = await pack.getIndex();
    const entries = srdFamiliars.map(name => index.find(entry => entry.name.slugify() === name)).filter(entry => entry);
    return await Promise.all(entries.map(entry => fromUuid(entry.uuid)));
}
async function sourceActors(folderName) {
    if (!folderName) return await srdActors();
    const actors = game.actors.filter(actor => actor.folder?.name === folderName);
    for (const pack of game.packs) {
        if (pack.documentName !== 'Actor') continue;
        const folderIds = pack.folders.filter(packFolder => packFolder.name === folderName).map(packFolder => packFolder.id);
        if (!folderIds.length) continue;
        const index = await pack.getIndex();
        const entries = index.filter(entry => folderIds.includes(entry.folder));
        actors.push(...await Promise.all(entries.map(entry => fromUuid(entry.uuid))));
    }
    return actors;
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'find-familiar') return;
    const existing = documentUtils.getEffectByIdentifier(workflow.actor, 'findFamiliar');
    if (existing) await documentUtils.deleteDocument(existing);
    const folder = automationUtils.getConfigValue(document, 'folder');
    const actors = await sourceActors(folder);
    if (!actors.length) {
        genericUtils.notify(_loc('CHRISPREMADES.Macros.All.FindFamiliar.NoActors', {folder}), {type: 'warn', localize: false});
        return;
    }
    const sourceActor = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.All.FindFamiliar.Choose'), actors, {sort: 'alphabetical'});
    if (!sourceActor) return;
    const creatureType = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.All.FindFamiliar.Type'), creatureTypeOptions().map(option => [option.label, option.value]));
    if (!creatureType) return;
    const name = automationUtils.getConfigValue(document, 'name') || sourceActor.name;
    const updates = {system: {details: {type: {value: creatureType}}}};
    const markerEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'findFamiliar',
        activityUuid: workflow.activity.uuid,
        unhideActivities: familiarActivities
    });
    const [markerEffect] = await effectUtils.createEffects(workflow.actor, [markerEffectData]);
    if (!markerEffect) return;
    const summon = await summonUtils.createSummon(workflow.actor, sourceActor, {
        name,
        updates,
        animation: automationUtils.getConfigValue(document, creatureType + 'Animation'),
        disposition: workflow.token.document.disposition,
        parent: markerEffect,
        sourceDocument: document
    });
    if (!summon) return;
    await summonUtils.placeSummons([summon], automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function pocketDimension({document, workflow}) {
    if (workflow.activity.identifier !== 'find-familiar-pocket-dimension') return;
    const [summon] = summonUtils.getSummonBySource(document);
    if (!summon) return;
    if (summon.token) return await summon.recall();
    await summonUtils.placeAllSourceSummons(document, automationUtils.getConfigValue(document, 'range'), {token: workflow.token.document});
}
async function touch({document, workflow}) {
    if (workflow.activity.identifier !== 'find-familiar-touch') return;
    const [summon] = summonUtils.getSummonBySource(document);
    const familiarToken = summon?.token;
    if (!familiarToken) return;
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name + ': ' + workflow.activity.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'findFamiliarTouch',
        duration: {seconds: 1},
        specialDuration: ['madeAttack'],
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: 'all', identifier: 'find-familiar-touch'}]}],
        changes: [
            {
                key: 'flags.midi-qol.rangeOverride.attack.all',
                mode: 0,
                value: 1,
                priority: 20
            }
        ]
    });
    const [casterEffect] = await effectUtils.createEffects(workflow.actor, [effectData]);
    await effectUtils.createEffects(familiarToken.actor, [effectData], {parentEntity: casterEffect});
}
async function early({document, workflow, token}) {
    if (workflow.item.type !== 'spell' || workflow.item.system.range.units !== 'touch') {
        genericUtils.notify('CHRISPREMADES.Macros.All.FindFamiliar.InvalidSpell', {type: 'info'});
        return true;
    }
    const originActivity = await effectUtils.getOriginActivity(document);
    const [summon] = summonUtils.getSummonBySource(originActivity?.item);
    const familiarToken = summon?.token;
    if (!familiarToken) {
        genericUtils.notify('CHRISPREMADES.Macros.All.FindFamiliar.TooFar', {type: 'info'});
        return true;
    }
    const range = automationUtils.getConfigValue(originActivity.item, 'touchRange');
    if (tokenUtils.getDistance(token, familiarToken) > range) {
        genericUtils.notify('CHRISPREMADES.Macros.All.FindFamiliar.TooFar', {type: 'info'});
        return true;
    }
    if (actorUtils.hasUsedReaction(familiarToken.actor)) {
        genericUtils.notify('CHRISPREMADES.Macros.All.FindFamiliar.ReactionUsed', {type: 'info'});
        return true;
    }
    await actorUtils.setReactionUsed(familiarToken.actor);
}
export const findFamiliar = {
    name: 'Find Familiar',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemRollFinished', macro: pocketDimension, priority: 50},
        {pass: 'itemRollFinished', macro: touch, priority: 50}
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
        range: {
            default: 30,
            type: 'number',
            label: 'CHRISPREMADES.Config.Range',
            category: 'summons'
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
export const findFamiliarTouch = {
    name: 'Find Familiar: Touch',
    version: '2.0.0',
    rules: 'all',
    roll: [
        {pass: 'actorPreambleComplete', macro: early, priority: 50}
    ]
};
