import {automationUtils, documentUtils, effectUtils, rollUtils} from '../../../proxy.mjs';
async function use({document: item, workflow}) {
    if (workflow.activity.identifier !== 'stabilize') return;
    const actor = workflow.targets.documents[0]?.actor;
    if (!actor || actor.system.attributes.hp.value > 0 || actor.statuses.has('dead') || actor.statuses.has('stable')) return;
    if (automationUtils.getConfigValue(item, 'check') !== false) {
        const [roll] = await workflow.actor.rollSkill({skill: 'med', target: 10}) ?? [];
        if (!roll || roll.total < 10) return;
    }
    await documentUtils.update(actor, {'system.attributes.death.success': 0, 'system.attributes.death.failure': 0});
    const {roll} = await rollUtils.rollDice('1d4', {document: workflow.actor, message: true, flavor: _loc('CHRISPREMADES.Macros.All.Stabilize.WakeUp'), rollMode: 'blindroll'});
    await effectUtils.createEffects(actor, [{
        name: _loc(CONFIG.statusEffects.find(status => status.id === 'stable')?.name ?? 'EFFECT.DND5E.StatusStable'),
        img: 'systems/dnd5e/icons/svg/statuses/stable.svg',
        origin: item.uuid,
        statuses: ['stable'],
        duration: {value: roll.total * 3600, units: 'seconds'},
        flags: {
            dae: {specialDuration: ['isHealed', 'isDamaged']},
            cat: {identifier: 'stabilized', macros: {effect: [{source: 'chris-premades', rules: 'all', identifier: 'stabilized'}], roll: [{source: 'chris-premades', rules: 'all', identifier: 'stabilized'}]}}
        }
    }]);
}
async function damaged({document: effect, ditem}) {
    if (ditem.totalDamage > 0) await documentUtils.deleteDocument(effect);
}
async function wake({document: effect}) {
    const actor = effectUtils.getActor(effect);
    if (!actor || actor.system.attributes.hp.value > 0 || actor.statuses.has('dead') || effect.duration.remaining > 0) return;
    await documentUtils.update(actor, {'system.attributes.hp.value': 1});
}
export const stabilize = {
    name: 'Stabilize',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        check: {
            default: true,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.Stabilize.Check',
            category: 'mechanics'
        }
    }
};
export const stabilized = {
    name: 'Stabilize: Stable',
    version: stabilize.version,
    rules: stabilize.rules,
    roll: [
        {
            pass: 'targetDamageComplete',
            macro: damaged,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: wake,
            priority: 50
        }
    ]
};
