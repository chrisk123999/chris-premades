import {animationUtils, documentUtils, genericUtils, itemUtils, Logging, summonUtils, tokenUtils} from '../../../proxy.mjs';
import {pickFile} from '../../animations/generic/spellParts.mjs';
const attackIdentifier = 'dancing-attack';
function getSword(item) {
    return summonUtils.getSummonsBySource(item).find(summon => summon.token)?.token;
}
async function preCreate({document, updates}) {
    if (genericUtils.getProperty(updates, 'prototypeToken.texture.src') || !animationUtils.jb2aCheck()) return;
    const base = 'jb2a.spiritual_weapon.' + (document.system.type?.baseItem || 'greatsword') + '.01.spectral.02.green';
    const path = pickFile(base, 'jb2a.spiritual_weapon.greatsword.01.spectral.02.green');
    const file = path && Sequencer.Database.getEntry(path)?.file;
    if (file) genericUtils.setProperty(updates, 'prototypeToken.texture.src', file);
}
async function created({document}) {
    const activity = itemUtils.getActivityByIdentifier(document, attackIdentifier);
    if (activity?.uses.spent) await documentUtils.update(activity, {'uses.spent': 0});
}
async function fly({document, workflow}) {
    if (workflow.activity.identifier !== attackIdentifier) return;
    const sword = getSword(document);
    const target = workflow.targets.first()?.document;
    if (!sword || !target) return;
    const distance = tokenUtils.getDistance(sword, target);
    if (distance > 35) {
        Logging.addMacroWarning('CPR', 'dancing-sword', 'CHRISPREMADES.Macros.Legacy.DancingSword.TooFar', {notify: 'info'});
        return true;
    }
    if (distance <= 5) return;
    const grid = sword.parent.grid.size;
    const side = (from, to, size) => from > to ? to + size * grid : from < to ? to - grid : to;
    await tokenUtils.displaceToken(sword, {destination: {x: side(sword.x, target.x, target.width), y: side(sword.y, target.y, target.height)}, action: 'fly'});
}
async function returned({document, workflow}) {
    if (workflow.activity.identifier !== attackIdentifier) return;
    if (itemUtils.getActivityByIdentifier(document.actor.items.get(document.id) ?? document, attackIdentifier)?.uses.value) return;
    await Promise.all(summonUtils.getSummonsBySource(document).map(summon => summonUtils.deleteSummon(summon)));
}
export const dancingSword = {
    name: 'Dancing Sword',
    version: '2.1.3',
    rules: '2014',
    roll: [
        {pass: 'itemPreambleComplete', macro: fly, priority: 50},
        {pass: 'itemRollFinished', macro: returned, priority: 50}
    ],
    summon: [
        {pass: 'preCreate', macro: preCreate, priority: 50},
        {pass: 'create', macro: created, priority: 50}
    ]
};
