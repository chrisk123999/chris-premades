import {dialogUtils, effectUtils, genericUtils, workflowUtils} from '../../../utils.js';
async function use({trigger, workflow}) {
    if (!workflow.targets.size) return;
    let weapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.equipped);
    if (!weapons.length) return;
    let selection = weapons[0];
    if (weapons.length > 1) {
        selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Attack.SelectWeapon', weapons);
        if (!selection) return;
    }
    let sourceEffect = workflow.item.effects.contents?.[0];
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    effectData.duration = {seconds: 1};
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    await workflowUtils.syntheticItemRoll(selection, Array.from(workflow.targets), {consumeResources: true, consumeUsage: true});
    await genericUtils.sleep(100);
    await genericUtils.remove(effect);
}
async function damage({trigger, ditem, workflow}) {
    if (!ditem.isHit || ditem.newHP != 0) return;
    if (workflowUtils.getActionType(workflow) != 'mwak') return;
    workflowUtils.preventDeath(ditem);
    genericUtils.setProperty(workflow, 'chris-premades.knockOut', ditem.actorUuid);
}
async function done({trigger, workflow}) {
    let actorUuid = workflow['chris-premades']?.knockOut;
    if (!actorUuid) return;
    let actor = await fromUuid(actorUuid);
    if (!actor) return;
    await effectUtils.applyConditions(actor, ['unconscious'], {overlay: true});
}
export let knockOut = {
    name: 'Knock Out',
    version: '1.3.115',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    }
};
export let knockOutEffect = {
    name: 'Knock Out: Effect',
    version: knockOut.version,
    rules: knockOut.rules,
    midi: {
        actor: [
            {
                pass: 'applyDamage',
                macro: damage,
                priority: 10
            },
            {
                pass: 'rollFinished',
                macro: done,
                priority: 50
            }
        ]
    }
};