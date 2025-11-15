import {actorUtils, combatUtils, dialogUtils, effectUtils, itemUtils, workflowUtils} from '../../../utils.js';

const TURN_FLAG_NAME = "resistanceOncePerTurn";
/* ---------------- helpers ---------------- */
function cloneEffectData(eff) { return foundry.utils.deepClone(eff.toObject()); }
function typeFromKey(k){ const p=(k||"").split("."); return p[p.length-1]||null; }

function returnActivity(item, identifier) {
  const activities = item?.system?.activities;
  if (!activities) return;
  const activityToReturn =
  (activities.find?.(a => a.identifier === identifier)) ??
  activities.value.find(a => a.identifier === identifier);
  return activityToReturn;
}

function findResistanceEntries(actor){
  const out = [];
  for (const eff of actor?.effects ?? []) {
    if (eff?.flags?.["chris-premades"]?.info?.identifier !== "resistance") continue;
    (eff.changes ?? []).forEach((c,i)=>{
      if (typeof c?.key !== "string") return;
      if (!c.key.startsWith("system.traits.dm.amount.")) return;
      out.push({ effect: eff, changeIndex: i, changeKey: c.key, dtype: typeFromKey(c.key) });
    });
  }
  return out;
}

function collectAppliedTypes(workflow) {
  const damageItem = workflow;
  const details = Array.isArray(damageItem?.damageDetail)
    ? damageItem.damageDetail
    : Array.isArray(damageItem?.rawDamageDetail)
      ? damageItem.rawDamageDetail
      : [];
  const set = new Set();
  for (const part of details) {
    if (Array.isArray(part?.types)) part.types.forEach(t => t && set.add(String(t)));
    else if (part?.type) set.add(String(part.type));
  }
  return set;
}

/* --------------- core: run in ACTOR pass before damage is applied --------------- */
async function applyRolledValue({ trigger: { entity: maybeEffect }, workflow }) {
  try {
    const defender = maybeEffect?.parent ?? workflow?.targets?.first()?.actor ?? null;
    if (!defender) { console.warn(`${TAG} no defender actor`); console.groupEnd(); return; }
    const entries = findResistanceEntries(defender);
    if (!entries.length) {return; }

    // Stage: zero ALL Resistance keys first, we ensure no resistance effects linger and apply damage modifications
    const updatesById = new Map(); // effect.id -> plain data
    for (const e of entries) {
      const id = e.effect.id;
      const data = updatesById.get(id) ?? cloneEffectData(e.effect);
      data.changes[e.changeIndex].value = "0";
      updatesById.set(id, data);
    }

    // Which types are actually in this damage packet? we need to know as we'll be too late to apply the dm in an onHit otherwise
    const appliedTypes = collectAppliedTypes(workflow);

    // Pick the first Resistance entry whose dtype appears here
    const matched = entries.find(e => appliedTypes.has(e.dtype));
    if (!matched) {
      await Promise.all([...updatesById.entries()].map(([id, data]) => defender.effects.get(id)?.update({ changes: data.changes })));
    return;
    }

    // Read config from the ACTUAL origin item of the matched effect. The actor may have multiple Resistance effects from different origins, though I imagine it to be super rare. 
    const origin = effectUtils.getOriginItemSync(matched.effect);
    const allowMulti = itemUtils.getConfig(origin, "allowMulti") === true; //homebrew config, we could live without it

    // CPR per-turn gate (only if allowMulti is false) - this is gated in the actual onHit phase for those rare cases of saving throw cancelling all damage (e.g. Sacred Flame)
    const canUseThisTurn = allowMulti || combatUtils.perTurnCheck(defender, TURN_FLAG_NAME, /*ownTurnOnly*/false);
    if (!canUseThisTurn) {
      await Promise.all([...updatesById.entries()].map(([id, data]) => defender.effects.get(id)?.update({ changes: data.changes })));
      return;
    }
    
    const parentCaster = matched?.effect?.parent
    const parentItem = await itemUtils.getItemByIdentifier(parentCaster, "resistance");
    const rollActivity = returnActivity(parentItem, "resistance-roll");
    const firstToken = actorUtils.getFirstToken(defender);
    const rollData = await workflowUtils.syntheticActivityRoll(rollActivity, targets = [firstToken] )

    const rolled = rollData?.utilityRolls[0].total ?? 1

    // Apply only to the matched change
    const id   = matched.effect.id;
    const data = updatesById.get(id) ?? cloneEffectData(matched.effect);
    data.changes[matched.changeIndex].value = String(-rolled);
    updatesById.set(id, data);

    // Push updates
    await Promise.all([...updatesById.entries()].map(([eid, edata]) => defender.effects.get(eid)?.update({ changes: edata.changes })));
  } catch (err) {
    console.error(`Resistance pre-apply error:`, err); console.groupEnd?.();
  }
}

async function use({trigger, workflow}) {
  if (workflow?.activity?.identifier != 'apply-resistance') return;
  // We could have used MIDI effect choice application here, but with CPR we're relying on translation keys - nice addition for the non english players. 
  let type = await dialogUtils.selectDamageType(
      [
        'acid',
        'bludgeoning',
        'cold', 
        'fire', 
        'lightning',
        'necrotic',
        'piercing',
        'poison',
        'radiant',
        'slashing',
        'thunder'
      ], 
      workflow.activity.name,
      'CHRISPREMADES.Generic.SelectDamageType'
    );
  if (!type) return;
  //each effect has the identifier and damageType flags.chris-premades.info, so we leverage this
  const effectToApply = workflow?.item?.effects.find(e =>
    e?.flags?.["chris-premades"]?.info?.identifier === "resistance" &&
    e?.flags?.["chris-premades"]?.info?.damageType === type
  );
  const effectData = effectToApply.toObject();
  const targetToken = workflow?.targets?.values().next().value;
  if (!targetToken) return console.error("no target found") ;
  await effectUtils.createEffect(targetToken?.actor, effectData, {concentrationItem: workflow?.item})
}

async function confirmUseOnHit({ trigger, workflow }) {
  try {
    // Figure out the defender for this onHit callback
    const defender =
      trigger?.entity?.actor ??
      trigger?.token?.actor ??
      workflow?.targets?.first()?.actor ??
      null;

    if (!defender) return;

    const entries = findResistanceEntries(defender);
    if (!entries.length) return;

    // Check the origin config (allowMulti etc.)
    const origin = effectUtils.getOriginItemSync(entries[0].effect);
    const allowMulti = itemUtils.getConfig(origin, "allowMulti") === true;
    if (allowMulti) return; // No once-per-turn gating if multi-use is allowed

    // If it's already marked used this turn, nothing to do
    const alreadyUsed = !combatUtils.perTurnCheck(defender, TURN_FLAG_NAME, /*ownTurnOnly*/false);
    if (alreadyUsed) return;

    // Did we actually apply a non-zero resistance value for this packet?
    // (applyRolledValue zeroes everything, then sets -rolled on the matching type)
    const hasActiveResistance = entries.some(e => {
      const change = e.effect.changes?.[e.changeIndex];
      if (!change) return false;
      const val = Number(change.value ?? 0);
      return Number.isFinite(val) && val !== 0;
    });

    if (!hasActiveResistance) return;

    // in most cases we would have known we were hit before, but in rare cases (e.g. Sacred Flame) we may not have - so we set the turn flag here on an onHit pass
    await combatUtils.setTurnCheck(defender, TURN_FLAG_NAME, /*reset*/false);

  } catch (err) {
    console.error("Resistance confirmUseOnHit error:", err);
  }
}

export let resistance = {
  name: "resistance",
  version: "1.0.0",
  rules: 'modern',
  midi: {
    item : [
      { pass: "preItemRoll", macro : use, priority : 50}
    ],
    actor: [
      { pass: "targetDamageRollComplete", macro: applyRolledValue, priority: 50 },
      { pass: "onHit", macro: confirmUseOnHit, priority: 50 },
    ]
  },
  config: [
    {
      value: "allowMulti",
      label: "CHRISPREMADES.Config.AllowMultiplePerTurn",
      type: "checkbox",
      default: false,
      homebrew: true,
      category: "homebrew"
    }
  ]
};