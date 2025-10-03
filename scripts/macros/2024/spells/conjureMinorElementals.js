import {constants, dialogUtils, effectUtils, itemUtils, tokenUtils, workflowUtils} from '../../../utils.js';
async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        duration: itemUtils.convertDuration(workflow.item),
        flags: {
            'chris-premades': {
                castData: workflow.castData
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['conjureMinorElementalsActive']);
    await effectUtils.createEffect(workflow.actor, effectData, {
        concentrationItem: workflow.item,
        strictlyInterdependent: true,
        rules: 'modern'
    });
}
async function damage({trigger: {entity: effect}, workflow}) {
    if (!constants.attacks.includes(workflow.activity.actionType)) return;
    let target = workflow.targets.first();
    if (!target) return;
    if (tokenUtils.getDistance(workflow.token, target) > 15) return;
    let originItem = await effectUtils.getOriginItem(effect);
    if (!originItem) return;
    let damageTypes = itemUtils.getConfig(originItem, 'damageTypes');
    let selection = await dialogUtils.selectDamageType(damageTypes, effect.name, 'CHRISPREMADES.Macros.ChaosBolt.Select');
    if (!selection) return;
    let castLevel = effect.flags['chris-premades'].castData.castLevel;
    let numDice = 2 + 2 * (castLevel - 4);
    await workflowUtils.bonusDamage(workflow, `${numDice}d8`, {damageType: selection});
}
export let conjureMinorElementals = {
    name: 'Conjure Minor Elementals',
    version: '1.3.84',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['acid', 'cold', 'fire', 'lightning'],
            options: constants.damageTypeOptions,
            homebrew: true,
            category: 'homebrew'
        }
    ]
};
export let conjureMinorElementalsActive = {
    name: 'Conjure Minor Elementals: Active',
    version: conjureMinorElementals.version,
    rules: conjureMinorElementals.rules,
    midi: {
        actor: [
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 50
            }
        ]
    }
};