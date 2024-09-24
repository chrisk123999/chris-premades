import {dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils, tokenUtils, workflowUtils} from '../../../utils.js';

async function turnStart({trigger: {entity: item, token, target}}) {
    let gazeConfig = itemUtils.getGenericFeatureConfig(item, 'gaze');
    if (tokenUtils.getDistance(target, token) > gazeConfig.distance) return;
    if (effectUtils.getEffectByStatusID(target.actor, 'blinded')) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'blinded')) return;
    if (effectUtils.getEffectByStatusID(token.actor, 'incapacitated')) return;
    if (!tokenUtils.canSee(target, token)) return;
    if (!tokenUtils.canSee(token, target)) return;
    if (!effectUtils.getEffectByStatusID(target.actor, 'surprised') && gazeConfig.allowAvert) {
        let selection = await dialogUtils.confirm(item.name, genericUtils.format('CHRISPREMADES.Macros.Gaze.AvertSelect', {tokenName: token.name}), {userId: socketUtils.firstOwner(target.actor, true)});
        if (selection) {
            let effectData = {
                name: genericUtils.translate('CHRISPREMADES.Macros.Gaze.AvertEffect'),
                img: 'icons/creatures/eyes/humanoid-single-blue.webp',
                origin: item.uuid,
                duration: {
                    seconds: 12
                },
                changes: [
                    {
                        key: 'flags.midi-qol.disadvantage.attack.all',
                        mode: 0,
                        value: 'targetActorUuid === "' + token.actor.uuid + '"',
                        priority: 20
                    }
                ],
                flags: {
                    dae: {
                        specialDuration: ['turnStart']
                    }
                }
            };
            if (gazeConfig.avertGrantsAdvantage) {
                effectData.changes.push({
                    key: 'flags.midi-qol.grants.advantage.attack.all',
                    mode: 0,
                    value: 'targetActorUuid === "' + token.actor.uuid + '"',
                    priority: 20
                });
            }
            await effectUtils.createEffect(target.actor, effectData);
            return;
        }
    }
    await workflowUtils.syntheticItemRoll(item, [target]);
}
export let gaze = {
    name: 'Gaze',
    version: '0.12.77',
    combat: [
        {
            pass: 'turnStartNear',
            macro: turnStart,
            priority: 50,
            disposition: 'enemy'
        }
    ],
    isGenericFeature: true,
    genericConfig: [
        {
            value: 'distance',
            label: 'CHRISPREMADES.Generic.Distance',
            type: 'number',
            default: 30
        },
        {
            value: 'allowAvert',
            label: 'CHRISPREMADES.Macros.Gaze.AllowAvert',
            type: 'checkbox',
            default: true
        },
        {
            value: 'avertGrantsAdvantage',
            label: 'CHRISPREMADES.Macros.Gaze.AvertAdvantage',
            type: 'checkbox',
            default: false
        }
    ]
};