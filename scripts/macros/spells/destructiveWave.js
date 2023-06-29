import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function destructiveWave({speaker, actor, token, character, item, args, scope, workflow}) {
    if (!(workflow.failedSaves.size > 0)) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'destructiveWave', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['Radiant', 'radiant'], ['Necrotic', 'necrotic']]);
    if (!selection) selection = 'radiant';
    let damageFormula = workflow.damageRoll._formula.replace('none', selection);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    new Sequence().effect().atLocation(workflow.token).file('jb2a.thunderwave.center.blue').scale(2.2).playbackRate(0.5).play();
    queue.remove(workflow.item.uuid);
}