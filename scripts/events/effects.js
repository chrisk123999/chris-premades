import {macros} from '../macros.js';
import {actorUtil} from './actorUtils.js';
function getEffectTriggerData(actor, trigger) {
    return actorUtil.getEffects(actor).filter(i => i.flags['chris-premades']?.macros?.effect?.[trigger]);
}
