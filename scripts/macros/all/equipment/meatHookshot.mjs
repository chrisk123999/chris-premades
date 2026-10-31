import {actorUtils, automationUtils, documentUtils, itemUtils, rollUtils, tokenUtils, workflowUtils} from '../../../proxy.mjs';
import {playTargetAnimations} from '../../generic/spellAnimation.mjs';
function launch({document: item, workflow}) {
    if (workflow.activity.identifier !== 'hookshot') return;
    workflowUtils.setWorkflowProperty(workflow, 'skipWeaponAnimation', true);
    const {animation, options} = automationUtils.getResolvedAnimation(item, 'animation', {source: 'chris-premades', identifier: 'weaponAnimation'});
    playTargetAnimations(workflow, {animation, options: {...options, style: 'thrown', projectile: 'dagger'}});
}
async function transform(item, activity) {
    const transformed = documentUtils.getEffectByIdentifier(item, 'meatHookshotTransformed');
    if (transformed) {
        await documentUtils.deleteDocument(transformed);
        return;
    }
    const hidden = {sickle: true, battleaxe: false, hookshot: false};
    const changes = Object.entries(hidden).map(([identifier, value]) => ({key: 'system.activities.' + itemUtils.getActivityByIdentifier(item, identifier).id + '.flags.cat.hidden', type: 'override', value, phase: 'initial', priority: 20}));
    await itemUtils.enchantItem(item, {
        name: activity.name,
        img: item.img,
        origin: item.uuid,
        system: {magical: false, changes},
        flags: {cat: {identifier: 'meatHookshotTransformed', noAnimation: true}}
    });
}
async function used({document: item, workflow}) {
    const identifier = workflow.activity.identifier;
    if (identifier === 'transform') {
        await transform(item, workflow.activity);
        return;
    }
    if (identifier !== 'hookshot' || !workflow.token) return;
    const target = workflow.hitTargets.first();
    if (!target?.actor) return;
    const token = workflow.token.document;
    const distance = tokenUtils.getDistance(token, target.document) - token.parent.grid.distance;
    if (distance <= 0) return;
    if (actorUtils.getSize(target.actor) > actorUtils.getSize(workflow.actor)) {
        await tokenUtils.slideToken(token, {sourceToken: target.document, distance: -distance});
        return;
    }
    const roll = await rollUtils.requestRoll(target.actor, 'save', 'str', {rollDC: 13});
    if (!roll || roll.total >= 13) return;
    await tokenUtils.slideToken(target.document, {sourceToken: token, distance: -distance});
}
export const meatHookshot = {
    name: 'Meat Hookshot',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemAttackRollComplete',
            macro: launch,
            priority: 40
        },
        {
            pass: 'itemRollFinished',
            macro: used,
            priority: 50
        }
    ]
};
