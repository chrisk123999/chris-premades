# CPR Events for Midi Workflows

This page provides information on the sequence of events triggered for MidiQOL workflows. Each event will fetch and run associated embedded macros from items, active effects, templates or regions. Events use the following prefixes to identify the context of their trigger:

- `target` includes events triggered for the target(s) of the item
- `scene` includes events triggered for all tokens on the scene, useful for third party reactions
- *No Prefix* - events triggered for the actor rolling the item

These other categories may have their events triggered at several points within a workflow if the conditions are met:

- `D20` events are triggered when any d20 is rolled by an actor for any reason
  - Using dice commands in chat without a token selected would not trigger these events
  - D20 rolls in scripts will trigger these events only if an actor uuid is provided: `new Roll('1d20', {actorUuid: "uuid here"}).evaluate()`
- `Bonus` events are triggered for any save, check, skill, or tool roll

There are many more events available beyond the ones shown here. A full list including descriptions and requirements is available in the [CPR Discord](https://discord.com/channels/1089258451949064296/1280057767947665440).

> *In MidiQOL versions 13.0.23+, saves can be rolled before damage with this setting enabled: `MidiQOL > Workflow Settings > Misc > Roll saves before damage`. This flowchart documents the default setting, damage rolled before saves.*

## Priority

Embedded macros are generally called in ascending priority order for each event. Macros associated with the "Apply Damage" events are the only exception: `applyDamage`, `targetApplyDamage`, and `sceneApplyDamage`. These are lumped together before being sorted by priority, so the order of `Use` -> `Target` -> `Scene` will vary depending on how your macros are configured. The "Apply Damage" events are represented with one node in the chart.

## Chart

```mermaid
---
config:
  themeVariables:
    fontSize: '20px'
---

flowchart TD
  subgraph use[" "]
    preTargeting
    preItemRoll
    preambleComplete
    utilityRollComplete
    postAttackRoll
    attackRollComplete 
    damageRollComplete
    savesComplete
    applyDamage
    rollFinished
    onHit
    targetPreItemRoll
    targetPreambleComplete
    targetUtilityRollComplete
    targetPostAttackRoll
    afterAttackRoll["<b>After Macros</b>
      <small><li>Heroic Inspiration Attack</li></small>"]:::edgeLabel
    targetAttackRollComplete
    targetDamageRollComplete
    targetSavesComplete
    targetRollFinished
    scenePreambleComplete
    afterScenePreamble["<b>After Macros</b>
      <small><li>Condition Resistance Checked</li>
      <li>Condition Vulnerability Checked</li>
      <li>Template Visibility Checked</li></small>"]:::edgeLabel
    sceneUtilityRollComplete
    scenePostAttackRoll
    sceneAttackRollComplete
    crit["<b>After Macros</b>
      <small><li>Crit/Fumble Homebrew</li></small>"]:::edgeLabel
    sceneDamageRollComplete
    afterSceneDamage["<b>After Macros</b>
      <small><li>Heroic Inspiration Damage</li>
      <li>Dice So Nice Shown</li>
      <li>Exploding Heals</li>
      <li>Manual Rolls</li></small>"]:::edgeLabel
    sceneRollFinished
    afterSceneRoll["<b>After Macros</b>
      <small><li>Condition Resistance Cleanup</li>
      <li>Condition Vulnerability Cleanup</li>
      <li>Mastery Automations</li>
      <li>Expire CPR Special Durations</li>
      <li>Delete Workflow Effects</li>
      <li>Cleave</li></small>"]:::edgeLabel
  end

  subgraph d20["D20 Rolls"]
    direction TB
    preEvaluation --> 
    scenePreEvaluation --> 
    postEvaluation --> 
    scenePostEvaluation
  end

  subgraph bonuses["Bonus"]
    situational -- Has Target --> targetSituational
    situational -- No Target --> sceneSituational
    targetSituational --> sceneSituational
    sceneSituational -->
    context -->
      preEvaluation
      scenePostEvaluation --> 
    bonus --> 
    sceneBonus -->
    post
  end

  preTargeting --> preItemRoll
  preItemRoll --> targetPreItemRoll
  targetPreItemRoll --> preambleComplete
  preambleComplete --> targetPreambleComplete
  targetPreambleComplete --> scenePreambleComplete
  scenePreambleComplete -.-> afterScenePreamble
    %% invis link for layout
    targetPreambleComplete ~~~ utilityRollComplete
    scenePreambleComplete -- Has Utility --> utilityRollComplete
    utilityRollComplete --> targetUtilityRollComplete
    targetUtilityRollComplete --> sceneUtilityRollComplete
    sceneUtilityRollComplete --> savesComplete

    scenePreambleComplete -- Has Attack --> preEvaluation
    scenePostEvaluation --> scenePostAttackRoll
    scenePostAttackRoll --> postAttackRoll
    postAttackRoll --> targetPostAttackRoll
    targetPostAttackRoll -.-> afterAttackRoll
    targetPostAttackRoll --> attackRollComplete
    attackRollComplete --> targetAttackRollComplete
    targetAttackRollComplete --> sceneAttackRollComplete 
    sceneAttackRollComplete -.-> crit
    sceneAttackRollComplete -- No Damage --> savesComplete 
    sceneAttackRollComplete -- Has Damage --> damageRollComplete

  scenePreambleComplete -- No Attack, Has Damage --> damageRollComplete
  scenePreambleComplete -- No Attack, No Damage --> savesComplete
  damageRollComplete --> targetDamageRollComplete
  targetDamageRollComplete --> sceneDamageRollComplete
  sceneDamageRollComplete -.-> afterSceneDamage
    sceneDamageRollComplete -- Has Save ---> situational
  post --> savesComplete
  sceneDamageRollComplete -- No Save --> savesComplete
  savesComplete --> targetSavesComplete
    targetSavesComplete -- Has Damage --> applyDamage
    applyDamage --> rollFinished
  targetSavesComplete -- No Damage --> rollFinished
  rollFinished --> targetRollFinished
  targetRollFinished --> onHit
  onHit --> sceneRollFinished
  sceneRollFinished -.-> afterSceneRoll

  %% invis links for layout

  classDef node stroke-width:2px,padding:10px
  classDef hidden display:none

  style use fill:#003636
  style bonuses fill:#016d6f
  style d20 fill:#015e60

%% color helper at https://www.learnui.design/tools/data-color-picker.html#single
%% graphic design is my passion 😎
```

### [Jump To Top](#cpr-events-for-midi-workflows)