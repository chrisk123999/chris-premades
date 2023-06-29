import {chris} from '../../helperFunctions.js';
import {queue} from '../../queue.js';
export async function chromaticOrb({speaker, actor, token, character, item, args, scope, workflow}) {
    if (workflow.hitTargets.size != 1) return;
    let queueSetup = await queue.setup(workflow.item.uuid, 'chromaticOrb', 50);
    if (!queueSetup) return;
    let selection = await chris.dialog('What damage type?', [['🧪 Acid', 'acid'], ['❄️ Cold', 'cold'], ['🔥 Fire', 'fire'], ['⚡ Lightning', 'lightning'], ['☁️ Thunder', 'thunder']]);
    if (!selection) {
        queue.remove(workflow.item.uuid);
        return;
    }
    let damageFormula = workflow.damageRoll._formula.replace('none', selection);
    let damageRoll = await new Roll(damageFormula).roll({async: true});
    await workflow.setDamageRoll(damageRoll);
    queue.remove(workflow.item.uuid);
    let animation;
    if (game.modules.get('jb2a_patreon')?.active) {
        animation = 'jb2a.guiding_bolt.02.';
        switch(selection) {
            case 'acid':
                animation += 'greenorange';
                break;
            case 'cold':
                animation += 'dark_bluewhite';
                break;
            case 'lightning':
                animation +='yellow';
                break;
            case 'thunder':
                animation += 'blueyellow';
                break;
            case 'fire':
                animation += 'red';
                break;
            case 'lightning':
                animation += 'yellow'
        }
    } else {
        animation = 'jb2a.guiding_bolt.01.blueyellow';
    }
    new Sequence().effect().atLocation(workflow.token).stretchTo(workflow.targets.first()).file(animation).play();
}