import {effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['deathWardWarded']);
    for (let target of workflow.targets) {
        await effectUtils.createEffect(target.actor, effectData, {identifier: 'deathWardTarget'});
    }
}
async function damageApplication({trigger: {entity: effect}, ditem}) {
    if (ditem.newHP > 0 || !ditem.isHit) return;
    workflowUtils.preventDeath(ditem);
    await genericUtils.remove(effect);
}
export let deathWard = {
    name: 'Death Ward',
    version: '1.1.0',
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
export let deathWardWarded= {
    name: 'Death Ward: Warded',
    version: deathWard.version,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damageApplication,
                priority: 250
            }
        ]
    }
};