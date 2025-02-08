import {effectUtils, genericUtils, itemUtils} from '../../utils.js';
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
    if (!effect) return;
    if (ditem.newHP > 0) return;
    ditem.newHP = 1;
    ditem.hpDamage = Math.abs(ditem.newHP - ditem.oldHP);
    ditem.damageDetail[0].value = ditem.hpDamage + ditem.oldTempHP;
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