import {crosshairUtils, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils, tokenUtils, workflowUtils} from '../../../../../proxy.mjs';
function isFirearm(workflow) {
    return workflow.item?.system.type?.value === 'firearm' && workflowUtils.isAttackType(workflow, 'weaponAttack');
}
function lineTargets(token, point, range) {
    const origin = token.object.center;
    const angle = Math.atan2(point.y - origin.y, point.x - origin.x);
    const length = range / canvas.dimensions.distance * canvas.dimensions.size;
    const end = {x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length};
    return token.parent.tokens.filter(target => {
        if (target === token || !target.actor || !target.object) return false;
        const {x, y, width, height} = target.object.bounds;
        return new PIXI.Rectangle(x + 1, y + 1, width - 2, height - 2).lineSegmentIntersects(origin, end, {inside: true});
    }).sort((a, b) => tokenUtils.getDistance(token, a) - tokenUtils.getDistance(token, b));
}
async function piercing({workflow}) {
    if (!await piercingShots(workflow)) await workflowUtils.refundUse(workflow);
}
async function piercingShots(workflow) {
    const token = workflow.token?.document;
    if (!token) return;
    const weapons = workflow.actor.items.filter(item => item.system.type?.value === 'firearm' && item.system.equipped);
    if (!weapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.TrickShots.NoFirearm', {type: 'info'});
        return;
    }
    const weapon = weapons.length > 1 ? await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.TrickShots.SelectFirearm', weapons) : weapons[0];
    if (!weapon) return;
    const range = itemUtils.getRange(weapon).value ?? 5;
    const point = await crosshairUtils.aimCrosshair({token, maxRange: range, crosshairsConfig: {icon: workflow.item.img, size: 5, anchorTopLeft: false}, checkOverlap: false});
    if (!point || point.cancelled) return;
    const [first, ...rest] = lineTargets(token, point, range);
    if (!first) return;
    const activity = weapon.system.activities.find(activity => activity.type === 'attack');
    if (!activity) return;
    const firstWorkflow = await workflowUtils.syntheticActivityRoll(activity, [first], {options: {workflowOptions: {cat: {firearmMisfireBonus: 1}}}});
    if (!firstWorkflow) return;
    if (!firstWorkflow.hitTargets.count || !rest.length) return true;
    const [effect] = await effectUtils.createEffects(workflow.actor, [{
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        system: {changes: [{key: 'flags.midi-qol.disadvantage.attack.all', type: 'custom', value: '1', priority: 20}]}
    }]) ?? [];
    const ammo = workflow.actor.items.get(weapon.getFlag('dnd5e', 'last.' + activity.id + '.ammunition'));
    const quantity = ammo?.system.quantity;
    try {
        for (const target of rest) await workflowUtils.syntheticActivityRoll(activity, [target], {consumeResources: false, options: {workflowOptions: {cat: {firearmNoMisfire: true}}}});
    } finally {
        if (effect) await documentUtils.deleteDocument(effect);
        if (ammo && workflow.actor.items.has(ammo.id) && ammo.system.quantity !== quantity) await documentUtils.update(ammo, {'system.quantity': quantity});
    }
    return true;
}
function violentGrit(effect) {
    return 1 + Number(effect.flags.dnd5e?.scaling ?? 0);
}
function violentConfig({document: effect, workflow}) {
    if (!isFirearm(workflow)) return;
    const current = Number(workflowUtils.getWorkflowProperty(workflow, 'firearmMisfireBonus') ?? 0);
    workflowUtils.setWorkflowProperty(workflow, 'firearmMisfireBonus', current + 2 * violentGrit(effect));
}
async function violentDamage({document: effect, workflow}) {
    if (!isFirearm(workflow) || !workflow.hitTargets.count) return;
    const faces = workflow.item.system.damage?.base?.denomination;
    if (faces) await workflowUtils.bonusDamage(workflow, violentGrit(effect) + 'd' + faces, {damageType: workflow.defaultDamageType});
}
async function violentFinished({document: effect, workflow}) {
    if (isFirearm(workflow)) await documentUtils.deleteDocument(effect);
}
export const piercingShot = {
    name: 'Piercing Shot',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: piercing,
            priority: 50
        }
    ]
};
export const violentShot = {
    name: 'Violent Shot',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'actorPreambleComplete',
            macro: violentConfig,
            priority: 50
        },
        {
            pass: 'actorDamageRoll',
            macro: violentDamage,
            priority: 50
        },
        {
            pass: 'actorRollFinished',
            macro: violentFinished,
            priority: 50
        }
    ]
};
