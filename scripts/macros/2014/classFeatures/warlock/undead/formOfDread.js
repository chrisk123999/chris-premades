import {activityUtils, actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let feature = activityUtils.getActivityByIdentifier(workflow.item, 'formOfDreadFear', {strict: true});
    if (!feature) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.activity),
        changes: [
            {
                key: 'system.traits.ci.value',
                mode: 2,
                value: 'frightened',
                priority: 20
            }
        ],
        flags: {
            'chris-premades': {
                formOfDread: {
                    originalAvatarImg: workflow.actor.img,
                    originalPrototypeImg: workflow.actor.prototypeToken.texture.src,
                    originalTokenImg: workflow.token.document.texture.src
                }
            }
        }
    };
    effectUtils.addMacro(effectData, 'midi.actor', ['formOfDreadActive']);
    effectUtils.addMacro(effectData, 'effect', ['formOfDreadActive']);
    effectUtils.addMacro(effectData, 'combat', ['formOfDreadActive']);
    let updates = {
        actor: {},
        token: {}
    };
    let avatarImg = itemUtils.getConfig(workflow.item, 'avatar');
    let tokenImg = itemUtils.getConfig(workflow.item, 'token');
    if (avatarImg) {
        genericUtils.setProperty(updates.actor, 'img', avatarImg);
    }
    if (tokenImg) {
        genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', tokenImg);
        genericUtils.setProperty(updates.token, 'texture.src', tokenImg);
    }
    await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'formOfDread'});
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(workflow.actor, updates.actor);
    }
    if (Object.entries(updates.token)?.length) {
        await genericUtils.update(workflow.token.document, updates.token);
    }
}
async function end({trigger: {entity: effect}}) {
    let {originalAvatarImg, originalPrototypeImg, originalTokenImg} = effect.flags['chris-premades'].formOfDread;
    let actor = effect.parent;
    if (!actor) return;
    let token = actorUtils.getFirstToken(actor)?.document;
    let currAvatarImg = actor.img;
    let currPrototypeImg = actor.prototypeToken.texture.src;
    let currTokenImg = token?.texture.src;
    let updates = {
        actor: {},
        token: {}
    };
    if (currAvatarImg !== originalAvatarImg) genericUtils.setProperty(updates.actor, 'img', originalAvatarImg);
    if (currPrototypeImg !== originalPrototypeImg) genericUtils.setProperty(updates.actor, 'prototypeToken.texture.src', originalPrototypeImg);
    if (currTokenImg !== originalTokenImg) genericUtils.setProperty(updates.token, 'texture.src', originalTokenImg);
    if (Object.entries(updates.actor)?.length) {
        await genericUtils.update(actor, updates.actor);
    }
    if (token && Object.entries(updates.token)?.length) {
        await genericUtils.update(token, updates.token);
    }
}
async function endCombat({trigger: {entity: effect}}) {
    await genericUtils.remove(effect);
}
async function late({trigger: {entity: effect}, workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let item = await effectUtils.getOriginItem(effect);
    let feature = activityUtils.getActivityByIdentifier(item, 'formOfDreadFear');
    if (!feature) return;
    if (!combatUtils.perTurnCheck(item, 'formOfDreadFear', true, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(feature.name, 'CHRISPREMADES.Macros.FormOfDread.Use');
    if (!selection) return;
    await combatUtils.setTurnCheck(item, 'formOfDreadFear');
    await workflowUtils.syntheticActivityRoll(feature, Array.from(workflow.hitTargets));
}
export let formOfDread = {
    name: 'Form of Dread',
    version: '1.1.31',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['formOfDread']
            }
        ]
    },
    config: [
        {
            value: 'avatar',
            label: 'CHRISPREMADES.Summons.CustomAvatar',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FormOfDread',
            type: 'file',
            default: '',
            category: 'visuals'
        },
        {
            value: 'token',
            label: 'CHRISPREMADES.Summons.CustomToken',
            i18nOption: 'CHRISPREMADES.Summons.CreatureNames.FormOfDread',
            type: 'file',
            default: '',
            category: 'visuals'
        }
    ],
    /*ddbi: {
        renamedItems: {
            'Form of Dread: Transform': 'Form of Dread',
            'Form of Dread': 'Form of Dread: Fear'
        }
    }*/
};
export let formOfDreadActive = {
    name: 'Form of Dread: Active',
    version: formOfDread.version,
    midi: {
        actor: [
            {
                pass: 'rollFinished',
                macro: late,
                priority: 50
            }
        ]
    },
    combat: [
        {
            pass: 'combatEnd',
            macro: endCombat,
            priority: 50
        }
    ],
    effect: [
        {
            pass: 'deleted',
            macro: end,
            priority: 50
        }
    ]
};