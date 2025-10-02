import {activityUtils, dialogUtils, genericUtils, itemUtils, rollUtils, socketUtils} from '../../../utils.js';

async function early({workflow}) {
    if (workflow.targets.size !== 1) return;
    let healerActor = workflow.actor;
    let healersKit = itemUtils.getItemByIdentifier(healerActor, 'healersKit');
    if (!healersKit?.system.uses.value) return;
    let targetActor = workflow.targets.first().actor;
    let ownerId = socketUtils.firstOwner(targetActor, true);
    let classSelection = await dialogUtils.selectHitDie(targetActor, workflow.item.name, 'CHRISPREMADES.Macros.Healer.SelectHitDie', {userId: ownerId, max: 1});
    if (!classSelection) return;
    await genericUtils.update(healersKit, {'system.uses.spent': healersKit.system.uses.spent + 1});
    let formula = '';
    for (let i of classSelection) {
        formula += i.amount + i.document.system.hd.denomination + ' + ';
        await genericUtils.update(i.document, {'system.hd.spent': i.document.system.hd.spent + i.amount});
    }
    formula += workflow.actor.system.attributes.prof;
    let activityData = activityUtils.withChangedDamage(workflow.activity, formula);
    workflow.item = itemUtils.cloneItem(workflow.item, {
        ['system.activities.' + workflow.activity.id]: activityData
    });
    workflow.activity = workflow.item.system.activities.get(workflow.activity.id);
}

async function healing({trigger: {entity: item}, workflow}) {
    if (workflow.activity.type !== 'heal') return;
    if (itemUtils.getConfig(item, 'spellOnly')) {
        if (!(workflow.item.type === 'spell' || workflow.item.system.type?.value === 'spellFeature' || activityUtils.getIdentifier(workflow.activity) === 'healerHeal')) return;
    }
    else {
        if (activityUtils.getIdentifier(workflow.item) !== 'healer') return;
    }
    let damageRolls = await Promise.all(workflow.damageRolls.map(async roll => {
        let newFormula = '';
        for (let i of roll.terms) {
            if (i.isDeterministic) {
                newFormula += i.expression;
            } else if (i.expression.toLowerCase().includes('r1')) {
                newFormula += i.formula;
            } else if (i.flavor) {
                newFormula += i.expression + 'r1[' + i.flavor + ']';
            } else {
                newFormula += i.expression + 'r1';
            }
        }
        return await rollUtils.damageRoll(newFormula, workflow.activity, roll.options);
    }));
    await workflow.setDamageRolls(damageRolls);
}

export let healer = {
    name: 'Healer',
    version: '1.2.36',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 10,
            },
        ],
        actor: [
            {
                pass: 'damageRollComplete',
                macro: healing,
                priority: 320
            },
        ]
    },
    config: [
        {
            value: 'spellOnly',
            label: 'CHRISPREMADES.Macros.Healer.SpellOnly',
            type: 'checkbox',
            default: true,
            category: 'homebrew',
            homebrew: true
        }
    ]
};