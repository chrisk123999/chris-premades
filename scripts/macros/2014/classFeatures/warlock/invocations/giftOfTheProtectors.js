import {effectUtils, genericUtils, workflowUtils} from '../../../../../utils.js';
async function use({workflow}) {  
    let effectData = {
        name: genericUtils.format('CHRISPREMADES.Auras.Source', {auraName: workflow.item.name}),
        img: workflow.item.img,
        origin: workflow.item.uuid,
        flags: {
            dae: {
                stackable: 'noneName'
            }
        }
    };
    let source = await effectUtils.createEffect(workflow.actor, effectData, {identifier: 'giftOfTheProtectorsSource'});
    genericUtils.setProperty(effectData, 'flags.dae.showIcon', true);
    effectData.name = workflow.item.name;
    effectUtils.addMacro(effectData, 'midi.actor', ['giftOfTheProtectorsProtected']);
    await Promise.all(workflow.targets.map(t => effectUtils.createEffect(t.actor, effectData, {identifier: 'giftOfTheProtectorsTarget', interdependent: true, parentEntity: source})));
}
async function damageApplication({trigger: {entity: effect}, ditem}) {    
    if (ditem.newHP > 0 || !ditem.isHit) return;
    workflowUtils.preventDeath(ditem);
    let source = await fromUuid(effect.flags['chris-premades']?.parentEntityUuid);
    let item = await effectUtils.getOriginItem(effect);
    if (source) await genericUtils.remove(source);
    else genericUtils.remove(effect);
    await item?.displayCard();
}
export let giftOfTheProtectors = {
    name: 'Eldritch Invocations: Gift of the Protectors',
    version: '1.5.26',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    ddbi: {
        correctedItems: {
            'Eldritch Invocations: Gift of the Protectors': {
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
export let giftOfTheProtectorsProtected = {
    name: 'Gift of the Protectors: Protected',
    version: giftOfTheProtectors.version,
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
