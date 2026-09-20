import {actorUtils, automationUtils, combatUtils, dialogUtils, documentUtils, effectUtils, itemUtils, workflowUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'form-of-dread') return;
    const sourceEffect = documentUtils.getEffectByIdentifier(document, 'formOfDreadActive');
    if (!sourceEffect) return;
    const {avatarImg, tokenImg, imgPriority} = automationUtils.getConfigValues(document, ['avatarImg', 'tokenImg', 'imgPriority']);
    const effectData = documentUtils.getEffectData(workflow.activity, sourceEffect.id, {
        activityUuid: workflow.activity.uuid
    });
    if (avatarImg) effectData.changes.push({key: 'img', mode: 5, value: avatarImg, priority: imgPriority});
    if (tokenImg) effectData.changes.push({key: 'token.texture.src', mode: 5, value: tokenImg, priority: imgPriority});
    const createEffect = async () => await effectUtils.createEffects(workflow.actor, [effectData]);
    const {animation, options} = automationUtils.getResolvedAnimation(document, 'animation');
    if (!animation) return await createEffect();
    await animation.macros.transform(workflow.token.document, {...options, callback: createEffect});
}
async function late({workflow}) {
    if (workflow.hitTargets.size !== 1 || !workflowUtils.isAttackType(workflow, 'attack')) return;
    if (!combatUtils.isOwnTurn(workflow.token.document)) return;
    const originItem = actorUtils.getItemByIdentifier(workflow.actor, 'form-of-dread');
    const activity = itemUtils.getActivityByIdentifier(originItem, 'form-of-dread-fear');
    if (!activity?.canUse || !activity.uses.value) return;
    const selection = await dialogUtils.confirm(activity.name, _loc('CHRISPREMADES.Macros.Legacy.FormOfDread.Use'));
    if (!selection) return;
    await workflowUtils.completeActivityUse(activity, workflow.hitTargets);
}
export const formOfDread = {
    name: 'Form of Dread',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50}
    ],
    config: {
        tokenImg: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Config.TokenImg',
            category: 'visuals'
        },
        avatarImg: {
            default: '',
            type: 'file',
            label: 'CHRISPREMADES.Config.AvatarImg',
            category: 'visuals'
        },
        imgPriority: {
            default: 50,
            type: 'number',
            label: 'CHRISPREMADES.Config.ImgPriority',
            category: 'visuals'
        },
        animation: {
            default: {
                source: 'chris-premades',
                identifier: 'shapeChange'
            },
            type: 'selectAnimation',
            inputs: ['token', 'options'],
            label: 'CHRISPREMADES.Config.Animation',
            category: 'visuals'
        }
    }
};
export const formOfDreadActive = {
    name: 'Form of Dread: Active',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'actorRollFinished', macro: late, priority: 50}
    ]
};
