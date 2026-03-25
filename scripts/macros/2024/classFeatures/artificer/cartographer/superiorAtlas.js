import {socket, sockets} from '../../../../../lib/sockets.js';
import {dialogUtils, effectUtils, genericUtils, itemUtils, socketUtils} from '../../../../../utils.js';
async function damaged({trigger: {entity: effect, token}, ditem}) {
    if (ditem.newHP || !ditem.oldHP) return;
    let sourceItem = await effectUtils.getOriginItem(effect);
    let sourceActor = sourceItem?.parent;
    if (!sourceActor) return;
    let feature = itemUtils.getItemByIdentifier(sourceActor, 'superiorAtlas');
    if (!feature) return;
    let classIdentifier = itemUtils.getConfig(feature, 'classIdentifier') || 'artificer';
    let newHP = 2 * (sourceActor.classes[classIdentifier]?.system.levels ?? 0);
    if (!newHP) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Requirements.MissingClass', {classIdentifier}), 'warn');
        return;
    }
    let targets = token.scene.tokens.filter(t => t.actor && t.id !== token.id && ['adventurersAtlas', 'adventurersAtlasCreator'].some(i => effectUtils.getEffectByIdentifier(t.actor, i))).map(t => t.object);
    let userId = socketUtils.firstOwner(token.actor, true);
    let selection; 
    let target;
    if (!targets.length)
        selection = await dialogUtils.confirmUseItem(feature, {userId});
    else {
        target = await dialogUtils.selectTargetDialog(
            feature.name, 
            genericUtils.format('CHRISPREMADES.Macros.SuperiorAtlas.Prompt', {itemName: feature.name, newHP}), 
            targets,
            {userId}
        );
        target = target?.[0];
        selection = !!target;
    }   
    if (!selection) return;
    ditem.totalDamage = ditem.oldHP - newHP;
    ditem.newHP = newHP;
    ditem.newTempHP = 0;
    ditem.hpDamage = ditem.totalDamage;
    ditem.damageDetail.forEach(i => i.value = 0);
    ditem.damageDetail[0].value = ditem.totalDamage;
    if (ditem.totalDamage < 0) ditem.damageDetail[0].type = 'healing';
    await genericUtils.remove(effect);
    await feature.displayCard();
    if (target) await socket.executeAsUser(sockets.teleport.name, userId, [token.document.uuid], token.document.uuid, {range: 5, centerpoint: target.center});
}
async function preChecks({workflow}) {
    if(effectUtils.getEffectByIdentifier(workflow.actor, 'adventurersAtlas')) return;
    genericUtils.notify('CHRISPREMADES.Macros.SuperiorAtlas.HaveMap', 'warn', {localize: true});
    return true;
}
export let superiorAtlas = {
    name: 'Superior Atlas',
    version: '1.5.17',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'preItemRoll',
                macro: preChecks,
                priority: 50,
                activities: ['unerringPath']
            }
        ]
    },
    config: [
        {
            value: 'classIdentifier',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            type: 'text',
            default: 'artificer',
            category: 'homebrew',
            homebrew: true
        }
    ],
    ddbi: {
        correctedItems: {
            'Superior Atlas': {
                system: {
                    uses: {
                        max: '1',
                        recovery: [
                            {
                                period: 'lr',
                                type: 'recoverAll'
                            }
                        ]
                    }
                }
            }
        }
    }
};
export let superiorAtlasEffect = {
    name: superiorAtlas.name,
    version: superiorAtlas.version,
    rules: superiorAtlas.rules,
    midi: {
        actor: [
            {
                pass: 'targetApplyDamage',
                macro: damaged,
                priority: 50
            }
        ]
    }
};