import {actorUtils, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';

async function early({workflow}) {
    if (workflow.targets.size !== 1) return;
    let bloodMaledict = itemUtils.getItemByIdentifier(workflow.actor, 'bloodMaledict');
    if (!bloodMaledict?.system.uses.value) {
        genericUtils.notify('CHRISPREMADES.Generic.NoMoreResource', 'info');
        return;
    }
    let amplify = await dialogUtils.confirm(workflow.item.name, 'CHRISPREMADES.Macros.BloodCurses.Amplify');
    if (!amplify) {
        await genericUtils.setFlag(workflow.item, 'chris-premades', 'curseOfBinding.amplify', false);
        if (actorUtils.getSize(workflow.targets.first().actor)  > 3) {
            genericUtils.notify('CHRISPREMADES.Macros.BigbysHand.Big', 'info');
            workflow.aborted = true;
        }
        return;
    }
    let damageDice = workflow.actor.system.scale?.['blood-hunter']?.['crimson-rite']?.formula;
    if (!damageDice) {
        genericUtils.notify(genericUtils.format('CHRISPREMADES.Generic.MissingScale', {scaleName: 'crimson-rite'}), 'warn');
        workflow.aborted = true;
        return;
    }
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'curseOfBinding.amplify', true);
    let damageRoll = await new Roll(damageDice + '[necrotic]').evaluate();
    // let damageRoll = await new CONFIG.Dice.DamageRoll(damageDice + '[necrotic]', {}, {type: 'necrotic'}).evaluate();
    damageRoll.toMessage({
        rollMode: 'roll',
        speaker: ChatMessage.implementation.getSpeaker({token: workflow.token}),
        flavor: workflow.item.name
    });
    await workflowUtils.applyDamage([workflow.token], damageRoll.total, 'none');
}
async function use({workflow}) {
    let bloodMaledict = itemUtils.getItemByIdentifier(workflow.actor, 'bloodMaledict');
    if (!bloodMaledict) return;
    await genericUtils.update(bloodMaledict, {'system.uses.spent': bloodMaledict.system.uses.spent + 1});
    if (!workflow.failedSaves.size) return;
    let effectData = {
        name: workflow.item.name,
        img: workflow.item.img,
        origin: workflow.item.uuid,
        changes: [
            {
                key: 'system.attributes.movement.all',
                mode: 0,
                value: 0,
                priority: 20
            }
        ],
        flags: {
            dae: {
                showIcon: true
            },
            'chris-premades': {
                conditions: ['reaction']
            }
        }
    };
    effectUtils.addMacro(effectData, 'combat', ['noReactions']);
    let amplify = workflow.item.flags['chris-premades']?.curseOfBinding?.amplify;
    if (!amplify) {
        effectData.flags.dae.specialDuration = ['turnEndSource'];
    } else {
        let dc = workflow.activity.save.dc.value;
        effectData.duration = {
            seconds: 60
        };
        effectData.changes.push({
            key: 'flags.midi-qol.OverTime',
            mode: 0,
            value: 'label=' + workflow.item.name + ' (' + genericUtils.translate('CHRISPREMADES.Medkit.Effect.OverTime.Labels.End') + '),turn=end,saveDC=' + dc + ',saveAbility=str,rollType=save,saveRemove=true',
            priority: 20
        });
    }
    await effectUtils.createEffect(workflow.failedSaves.first().actor, effectData);
}
export let curseOfBinding = {
    name: 'Blood Curse of Binding',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 50
            },
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    ddbi: {
        removedItems: {
            'Blood Curse of Binding': [
                'Blood Curses: Blood Curse of Binding'
            ]
        }
    }
};