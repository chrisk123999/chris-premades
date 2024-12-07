import {dialogUtils, effectUtils, genericUtils, itemUtils} from '../../../utils.js';

async function use({workflow}) {
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.actor.uuid,
        duration: itemUtils.convertDuration(workflow.activity)
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['potionOfAdvantage']);
    effectUtils.addMacro(effectData, 'check', ['potionOfAdvantage']);
    effectUtils.addMacro(effectData, 'save', ['potionOfAdvantage']);
    effectUtils.addMacro(effectData, 'skill', ['potionOfAdvantage']);
    await effectUtils.createEffect(workflow.targets.first()?.actor ?? workflow.actor, effectData, {identifier: 'potionOfAdvantage'});
}
async function situational({trigger: {entity: effect, options}}) {
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.PotionOfAdvantage.Select');
    if (!selection) return;
    options.advantage = true;
    await genericUtils.remove(effect);
}
async function early({trigger: {entity: effect}, workflow}) {
    if (workflow.advantage) return;
    let selection = await dialogUtils.confirm(effect.name, 'CHRISPREMADES.Macros.PotionOfAdvantage.Select');
    if (!selection) return;
    workflow.advantage = true;
    workflow.attackAdvAttribution.add(genericUtils.translate('DND5E.Advantage') + ': ' + effect.name);
    await genericUtils.remove(effect);
}
export let potionOfAdvantage = {
    name: 'Potion of Advantage',
    version: '0.12.70',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ],
        actor: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 60
            }
        ]
    },
    check: [
        {
            pass: 'situational',
            macro: situational,
            priority: 50
        }
    ],
    save: [
        {
            pass: 'situational',
            macro: situational,
            priority: 50
        }
    ],
    skill: [
        {
            pass: 'situational',
            macro: situational,
            priority: 50
        }
    ]
};