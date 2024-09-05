import {actorUtils, combatUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils, workflowUtils} from '../../../../utils.js';

async function use({workflow}) {
    let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Form of Dread: Fear', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.FormOfDread.Fear', identifier: 'formOfDreadFear'});
    if (!featureData) {
        errors.missingPackItem();
        return;
    }
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        duration: itemUtils.convertDuration(workflow.item),
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
    let effect = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'formOfDread'});
    await itemUtils.createItems(workflow.actor, [featureData], {parentEntity: effect});
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
async function late({workflow}) {
    if (workflow.hitTargets.size !== 1) return;
    if (!constants.attacks.includes(workflow.item.system.actionType)) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'formOfDreadFear');
    if (!feature) return;
    if (!combatUtils.perTurnCheck(feature, 'formOfDreadFear', true, workflow.token.id)) return;
    let selection = await dialogUtils.confirm(feature.name, 'CHRISPREMADES.Macros.FormOfDread.Use');
    if (!selection) return;
    await combatUtils.setTurnCheck(feature, 'formOfDreadFear');
    await workflowUtils.syntheticItemRoll(feature, [workflow.hitTargets.first()]);
}
export let formOfDread = {
    name: 'Form of Dread',
    version: '0.12.55',
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
    ]
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