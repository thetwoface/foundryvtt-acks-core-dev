import { AcksSurprise } from "./surprise-manager.js";
import { AcksUtility } from "./utility.js";

export class AcksCombatClass extends Combat {

  /*******************************************************/
  /**
   * Return the Array of combatants sorted into initiative order, breaking ties alphabetically by name.
   * @returns {Combatant[]}
   */
  setupTurns2() {
    console.log("setup turns !")

    // Determine the turn order and the current turn
    const turns = this.combatants.contents.sort(this._sortCombatants);
    if (this.turn !== null) this.turn = Math.clamp(this.turn, 0, turns.length - 1);

    // Update state tracking
    let c = turns[this.turn];
    this.current = this.getCurrentState(c);
    /*this.current = {
      round: this.round,
      turn: this.turn,
      combatantId: c ? c.id : null,
      tokenId: c ? c.tokenId : null
    };*/

    // Return the array of prepared turns
    this.turns = turns;
    return turns
  }

  /*******************************************************/
  async rollInitiative(ids, options) {
    ids = typeof ids === "string" ? [ids] : ids;
    let messages = [];

    // Get current groups 
    let groups = this.getFlag('acks', 'groups') || [];

    for (let cId of ids) {
      const c = this.combatants.get(cId);
      console.log("Init for combattant", cId, c, ids)
      let id = c._id || c.id
      // get the associated token 
      let tokenId = c.token.id;
      // Check if the current token ID is in a group  
      let groupData = groups.find((groupData) => groupData.tokens.includes(tokenId));
      let initValue = -1;
      let showMessage = true
      let roll
      if (groupData && groupData.initiative > 0) {
        initValue = groupData.initiative;
        showMessage = false
      } else {
        roll = c.getInitiativeRoll();
        await roll.evaluate();
        initValue = roll.total;
      }
      if ( groupData ) {
        groupData.initiative = initValue
      }
      await this.updateEmbeddedDocuments("Combatant", [{ _id: id, initiative: initValue }]);

      if (showMessage) {
        // Determine the roll mode
        let rollMode = game.settings.get("core", "rollMode");
        if ((c.token.hidden || c.hidden)
          && (rollMode === "roll")) {
          rollMode = "gmroll";
        }

        // Construct chat message data
        const messageData = foundry.utils.mergeObject({
          speaker: {
            scene: canvas.scene._id,
            actor: c.actor?.id || null,
            token: c.token.id,
            alias: c.token.name
          },
          flavor: game.i18n.format('ACKS.roll.individualInit', {
            name: c.token.name,
          }),
        }, {});

        const chatData = await roll.toMessage(messageData, {
          rollMode,
          create: false,
        });
        if (messages.length > 0) {
          chatData.sound = null;
        }
        messages.push(chatData);
      }
    }
    
    await CONFIG.ChatMessage.documentClass.create(messages);
    this.pools = AcksCombat.getCombatantsPool();
    this.processOutNumbering();

    return this;

  }
  /*******************************************************/
  async rollAll(options) {
    if ( !this.getFlag("acks", "initDone") ) {
      ui.notifications.warn(game.i18n.localize("COMBAT.CombatNotStarted"));
      return;
    }
    return super.rollAll(options)
  }

  /*******************************************************/
  async rollNPC(options) {
    if ( !this.getFlag("acks", "initDone") ) {
      ui.notifications.warn(game.i18n.localize("COMBAT.CombatNotStarted"));
      return;
    }
    return super.rollNPC(options)
  }

  /*******************************************************/
  async internalStartCombat() {
    await this.setFlag("acks", "initDone", true);
    this._playCombatSound("startEncounter");
    let updateData = { round: 1, turn: 0, initDone: true };

    await this.rollAll()

    Hooks.callAll("combatStart", this, updateData);
    console.log(">>>>>>>>>> Start Combat", this, updateData);
    

    return this.update(updateData);
  }

  /*******************************************************/
  cleanupStatus(status) {
    this.combatants.forEach((cbt) => {
      if (cbt?.actor?.hasEffect(status)) {
        AcksUtility.removeEffect(cbt.actor, status);
      }
    });
  }

  /*******************************************************/
  async startCombat() {
    console.log("Start Combat 1 !")
    this.cleanupStatus("overnumbering")
    let pools = AcksCombat.getCombatantsPool();
    this.pools = pools;

    console.log("Start Combat 2 !", pools)
    let surpriseDialog = new AcksSurprise({ pools, combatData: this });
    await surpriseDialog.render(true);
  }

  /*******************************************************/
  async nextTurn() {
    console.log("NEXT TURN");

    let turn = this.turn ?? -1;
    let skipDefeated = this.settings.skipDefeated;

    // Determine the next turn number
    let next = null;
    for (let [i, t] of this.turns.entries()) {
      console.log("Turn", t);
      if (i <= turn) continue;
      if (skipDefeated && t.isDefeated) continue;
      if (t.actor?.hasEffect("surprised")) {
        if (this.round == 1) {
          ui.notifications.info(`${t.actor.name} is surprised, so skipped in initiative countdown.`);
          continue;
        } else {
          await AcksUtility.removeEffect(t.actor, "surprised");
        }
      }
      next = i;
      break;
    }

    // Maybe advance to the next round
    let round = this.round;
    if ((this.round === 0) || (next === null) || (next >= this.turns.length)) {
      return this.nextRound();
    }

    // Update the document, passing data through a hook first
    const updateData = { round, turn: next };
    const updateOptions = { advanceTime: CONFIG.time.turnTime, direction: 1 };
    Hooks.callAll("combatTurn", this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  /*******************************************************/
  async nextRound() {
    console.log('NEXT ROUND')
    let turn = this.turn === null ? null : 0; // Preserve the fact that it's no-one's turn currently.
    // Remove surprised effects
    if (this.round == 1) {
      this.turns.forEach(t => t.actor.hasEffect("surprised") ? AcksUtility.removeEffect(t.actor, "surprised") : null);
    }
    this.turns.forEach(t => t.actor.hasEffect("delayed") ? AcksUtility.removeEffect(t.actor, "delayed") : null);
    this.turns.forEach(t => t.actor.hasEffect("done") ? AcksUtility.removeEffect(t.actor, "done") : null);
    console.log("ROUND", this.round, this.turns);

    AcksCombat.resetInitiative(this);

    if (this.settings.skipDefeated && (turn !== null)) {
      turn = this.turns.findIndex(t => !t.isDefeated && (this.round == 1 && !t.actor.hasEffect("surprised")));
      if (turn === -1) {
        ui.notifications.warn("COMBAT.NoneRemaining", { localize: true });
        turn = 0;
      }
    }
    let advanceTime = Math.max(this.turns.length - this.turn, 0) * CONFIG.time.turnTime;
    advanceTime += CONFIG.time.roundTime;
    let nextRound = this.round + 1;


    // Update the document, passing data through a hook first
    const updateData = { round: nextRound, turn };
    const updateOptions = { advanceTime, direction: 1 };
    Hooks.callAll("combatRound", this, updateData, updateOptions);
    return this.update(updateData, updateOptions);
  }

  /*******************************************************/
  processOutNumbering() {
    let pools = this.pools;
    let hostileMore = pools.hostile.length > pools.friendly.length;
    let friendlyMore = pools.friendly.length > pools.hostile.length;
    this.combatants.forEach((cbt) => {
      if (cbt.token.disposition == -1 && cbt.actor.hasEffect("overnumbering") && friendlyMore) {
        AcksUtility.removeEffect(cbt.actor, "overnumbering");
      }
      if (cbt.token.disposition == 1 && cbt.actor.hasEffect("overnumbering") && hostileMore) {
        AcksUtility.removeEffect(cbt.actor, "overnumbering");
      }
      if (cbt.token.disposition == -1 && !cbt.actor.hasEffect("overnumbering") && hostileMore) {
        AcksUtility.addUniqueStatus(cbt.actor, "overnumbering");
      }
      if (cbt.token.disposition == 1 && !cbt.actor.hasEffect("overnumbering") && friendlyMore) {
        AcksUtility.addUniqueStatus(cbt.actor, "overnumbering");
      }
    });
  }

  /*******************************************************/
  _sortCombatants(a, b) {
    if (a.initiative === b.initiative) {
      if (a.actor.hasEffect("overnumbering")) {
        return 1;
      }
      if (b.actor.hasEffect("overnumbering")) {
        return -1;
      }
      return a.name.localeCompare(b.name);
    }
    return b.initiative - a.initiative;
  }

  /*******************************************************/
  async endCombat() {
    return Dialog.confirm({
      title: game.i18n.localize("COMBAT.EndTitle"),
      content: `<p>${game.i18n.localize("COMBAT.EndConfirmation")}</p>`,
      yes: () => {
        this.cleanupStatus("surprised");
        this.cleanupStatus("overnumbering");
        this.delete()
      }
    });
  }

  /*******************************************************/
  manageGroup(groupTokens) {
    // Check if the tokens are in the current combatant list 
    let combatants = this.combatants;
    let combatantTokens = combatants.map(c => c.token.id);
    let missingTokens = groupTokens.filter(t => !combatantTokens.includes(t.id));
    if (missingTokens.length > 0) {
      ui.notifications.warn("Tokens are not in the combatant list");
      return;
    }

    let groups = foundry.utils.duplicate(this.getFlag('acks', 'groups') || [])
    // Group index is the group size
    let groupId = groups.length;
    groups[groupId] = {initiative: -1, tokens: groupTokens.map(t => t.id) }

    // Remove tokens already present in another group
    groups.forEach(function (groupData, id) {
      if (id != groupId) {
        groupTokens.forEach(t => {
          if (groupData.tokens.includes(t.id)) {
            groupData.tokens.splice(groupData.tokens.indexOf(t.id), 1);
          }
        });
      }
    })
    // Then parse the group array and remove empty or single groups
    groups = groups.filter((groupData) => {
      return groupData.tokens.length > 1;
    });
    // Save the groups
    this.setFlag('acks', 'groups', groups);
    ui.notifications.info("Groups created/updated");
    // Log the current group state
    console.log("Groups", groups);
  }

}
export class AcksCombat {

  /*******************************************************/
  static async rollInitiative(combat, data) {
    // Initialize groups.
    data.combatants = [];
    let groups = {};
    combat.combatants.forEach((cbt) => {
      groups[cbt.flags.acks.group] = { present: true };
      data.combatants.push(cbt);
    });

    // Roll initiative for each group.
    for (const group in groups) {
      const roll = new Roll("1d6");
      await roll.evaluate();
      await roll.toMessage({
        flavor: game.i18n.format('ACKS.roll.initiative', {
          group: CONFIG["ACKS"].colors[group],
        }),
      });

      groups[group].initiative = roll.total;
    }

    // Set the inititative for each group combatant.
    for (const combatant of data.combatants) {
      if (!combatant.actor) {
        return;
      }

      let initiative = groups[combatant.flags.acks.group].initiative;
      if (combatant.actor.system.isSlow) {
        initiative -= 1;
      }

      await combatant.update({
        initiative: initiative,
      });
    }

    combat.setupTurns();
  }

  /*******************************************************/
  static async resetInitiative(combat, data) {
    const reroll = game.settings.get("acks", "initiativePersistence");
    if (!["reset", "reroll"].includes(reroll)) {
      return;
    }

    combat.resetAll();
  }

  /*******************************************************/
  static async rollCombatantInitiative(combat, combatant, updates, messages, id, index) {
    const roll = combatant.getInitiativeRoll();
    await roll.evaluate();
    let value = roll.total;

    if (combat.settings.skipDefeated && combatant.defeated) {
      value = -790;
    }

    updates.push({
      combatantId: id,
      _id: id,
      initiative: value,
      turn: 1,

    });

    // Determine the roll mode
    let rollMode = game.settings.get("core", "rollMode");
    if ((combatant.token.hidden || combatant.hidden)
      && (rollMode === "roll")) {
      rollMode = "gmroll";
    }

    // Construct chat message data
    const messageData = foundry.utils.mergeObject({
      speaker: {
        scene: canvas.scene._id,
        actor: combatant.actor?.id || null,
        token: combatant.token.id,
        alias: combatant.token.name
      },
      flavor: game.i18n.format('ACKS.roll.individualInit', {
        name: combatant.token.name,
      }),
    }, {});

    const chatData = await roll.toMessage(messageData, {
      rollMode,
      create: false,
    });

    // Only play one sound for the whole set.
    if (index > 0) {
      chatData.sound = null;
    }

    messages.push(chatData);

  }
  /*******************************************************/
  static async individualInitiative(combat, data) {
    const updates = [];
    const messages = [];

    let nbHostile = combat.pools.hostile.length;
    let nbFriendly = combat.pools.friendly.length;

    let index = 0;

    for (const [id, combatant] of combat.combatants.entries()) {
      this.rollCombatantInitiative(combat, combatant, updates, messages, id, index);
      ++index;
    }

    setTimeout(function () {
      combat.updateEmbeddedDocuments("Combatant", updates);
    }, 400);
    await CONFIG.ChatMessage.documentClass.create(messages);

    // Now setup the first turn of the first round (ie surprised management)
    let turn = 0;
    if (data) {
      if (data.round == 1) {
        for (let i = 0; i < combat.turns.length; i++) {
          if (!combat.turns[i].actor.hasEffect("surprised")) {
            turn = i;
            break;
          }
        }
      }
      data.turn = turn;
    }
  }

  /*******************************************************/
  static format(object, html, user) {
    let colorEnabled = game.settings.get("acks", "enable-combatant-color");
    let colorFriendlies = "#00FF00";
    let colorHostiles = "#FF0000";    
    try {
      colorFriendlies = game.settings.get("acks", "color-friendlies");
      colorHostiles = game.settings.get("acks", "color-hostiles");
    } catch (e) { 
      console.log("Color settings not found", e);
    }

    html.find(".initiative").each((_, span) => {
      span.innerHTML =
        span.innerHTML == "-789.00"
          ? '<i class="fas fa-weight-hanging"></i>'
          : span.innerHTML;
      span.innerHTML =
        span.innerHTML == "-790.00"
          ? '<i class="fas fa-dizzy"></i>'
          : span.innerHTML;
    });

    let rollNPC = html.find(`[data-control='rollNPC']`);
    rollNPC.after(` <a class="combat-button combat-control create-group" aria-label="{{localize 'COMBAT.createGroup'}}" role="button"
        data-tooltip="COMBAT.createGroup" data-control="create-group" {{#unless turns}}disabled{{/unless}}>
        <i class="fa-duotone fa-solid fa-people-group"></i>
      </a>` );

    console.log("Roll NPC", rollNPC);

    html.find(".combatant").each((_, ct) => {
      // Append spellcast and retreat
      const controls = $(ct).find(".combatant-controls .combatant-control");
      //console.log("Combat controls", ct.dataset);
      if (ct?.dataset?.combatantId) {
        const cmbtant = game.combat.combatants.get(ct.dataset.combatantId);
        if ( cmbtant?.actor) {
          const actionDone = cmbtant.actor.hasEffect("done") ? "active" : "";
          controls.eq(1).after(
            `<a class='combatant-control action-done ${actionDone}' data-tooltip="Done"><i class='fas fa-check'></i></a>`
          );
          const readied = cmbtant.actor.hasEffect("readied") ? "active" : "";
          controls.eq(1).after(
            `<a class='combatant-control click-readied ${readied}' data-tooltip="Readied"><i class='fas fa-thumbs-up'></i></a>`
          );
          const delayed = cmbtant.actor.hasEffect("delayed") ? "active" : "";
          controls.eq(1).after(
            `<a class='combatant-control click-delayed ${delayed}' data-tooltip="Delayed"><i class='fas fa-clock'></i></a>`
          );
          const slumbering = cmbtant.actor.hasEffect("slumbering") ? "active" : "";
          controls.eq(1).after(
            `<a class='combatant-control click-slumbering ${slumbering}' data-tooltip="Slumbering"><i class='fas fa-person-falling-burst'></i></a>`
          );
          const spellActive = cmbtant.flags.acks?.prepareSpell ? "active" : "";
          controls.eq(1).after(
            `<a class='combatant-control prepare-spell ${spellActive}' data-tooltip="Casting"><i class='fas fa-magic'></i></a>`
          );
        }
      }
    });

    AcksCombat.announceListener(html);

    html.find(".combatant").each((_, ct) => {
      // Get the groups 
      const groups = game.combat.getFlag('acks', 'groups') || [];

      if (colorEnabled) {
        const combatant = object.viewed.combatants.get(ct.dataset.combatantId);
        // Search if the combatant token is inside a group
        let tokenH4 = $(ct).find("h4");
        groups.forEach((groupData, index) => {
          if (groupData.tokens?.includes(combatant.token.id)) {
            // Add the group ID to the H4 content text
            tokenH4.text(tokenH4.text() + ` [G${index}]`);
          }
        })
        // Append colored flag
        let color = combatant.token.disposition === 1 ? colorFriendlies : colorHostiles;
        console.log("Token H4", tokenH4, color);
        tokenH4.css("color", color);
      }
    });
    //AcksCombat.addListeners(html);
  }

  /*******************************************************/
  static updateCombatant(combat, combatant, data) {
    let init = "individual" //UNUSED game.settings.get("acks", "initiative");
    // Why do you reroll ?
    // Legacy Slowness code from OSE
    //    if (combatant.actor.data.data.isSlow) {
    //      data.initiative = -789;
    //      return;
    //    }
    if (data.initiative && init == "group") {
      let groupInit = data.initiative;
      // Check if there are any members of the group with init
      combat.combatants.forEach((ct) => {
        if (
          ct.initiative &&
          ct.initiative != "-789.00" &&
          ct._id != data._id &&
          ct.flags.acks.group == combatant.flags.acks.group
        ) {
          groupInit = ct.initiative;
          // Set init
          data.initiative = parseInt(groupInit);
        }
      });
    }
  }

  /*******************************************************/
  static announceListener(html) {
    html.find(".combatant-control.hold-turn").click(async (event) => {
      event.preventDefault();

      // Toggle hold announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      await combatant.update({
        _id: id,
        flags: {
          acks: {
            holdTurn: !isActive,
          },
        },
      });
    })

    html.find(".combatant-control.prepare-spell").click(async (event) => {
      event.preventDefault();

      // Toggle spell announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('actionDone');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "done")
      } else {
        AcksUtility.addUniqueStatus(combatant.actor, "done");
      }
    });

    html.find(".combatant-control.action-done").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "done")
      } else {
        AcksUtility.removeEffect(combatant.actor, "delayed");
        AcksUtility.removeEffect(combatant.actor, "readied");
        AcksUtility.addUniqueStatus(combatant.actor, "done");
      }
    });

    html.find(".combatant-control.click-readied").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "readied");
      } else {
        AcksUtility.removeEffect(combatant.actor, "delayed");
        AcksUtility.addUniqueStatus(combatant.actor, "readied");
      }
    });

    html.find(".combatant-control.click-delayed").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "delayed");
      } else {
        AcksUtility.removeEffect(combatant.actor, "readied");
        AcksUtility.addUniqueStatus(combatant.actor, "delayed");
      }
    });

    html.find(".combatant-control.click-slumbering").click(async (event) => {
      event.preventDefault();

      // Toggle retreat announcement
      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const isActive = event.currentTarget.classList.contains('active');
      const combatant = game.combat.combatants.get(id);
      if (isActive) {
        AcksUtility.removeEffect(combatant.actor, "slumbering");
      } else {
        AcksUtility.addUniqueStatus(combatant.actor, "slumbering");
      }
    });

    html.find(".combat-control.create-group").click(async (event) => {
      event.preventDefault();
      let groupTokens = canvas.tokens.controlled
      // Check if all tokens are NPCs
      for (let token of groupTokens) {
        if (token.actor.hasPlayerOwner) {
          ui.notifications.warn("You can't group player tokens");
          return;
        }
      }
      // Check if number of tokens is greater than 1 
      if (groupTokens.length < 2) {
        ui.notifications.warn("You can't group a single token");
        return;
      }
      game.combat.manageGroup(groupTokens);
    });

  }

  /*******************************************************/
  static addListeners(html) {
    // Cycle through colors
    html.find(".combatant-control.flag").click(async (event) => {
      event.preventDefault();

      if (!game.user.isGM) {
        return;
      }

      const currentColor = event.currentTarget.style.color;
      const colors = Object.keys(CONFIG.ACKS.colors);
      let index = colors.indexOf(currentColor);
      if (index + 1 == colors.length) {
        index = 0;
      } else {
        index++;
      }

      const id = $(event.currentTarget).closest(".combatant")[0].dataset.combatantId;
      const combatant = game.combat.combatants.get(id);
      await combatant.update({
        combatantId: id,
        _id: id,
        flags: {
          acks: {
            group: colors[index],
          },
        },
      });
    });

    html.find('.combat-control[data-control="reroll"]').click(async (event) => {
      event.preventDefault();

      if (!game.combat) {
        return;
      }

      const data = {};
      AcksCombat.rollInitiative(game.combat, data);

      await game.combat.update({
        data: data,
      })

      game.combat.setupTurns();
    });
  }

  /*******************************************************/
  static activateCombatant(li) {
    const turn = game.combat.turns.findIndex(turn => turn._id === li.data('combatant-id'));
    game.combat.update({ turn: turn })
  }

  /*******************************************************/
  static addContextEntry(html, options) {
    options.unshift({
      name: "Set Active",
      icon: '<i class="fas fa-star-of-life"></i>',
      callback: AcksCombat.activateCombatant
    });
  }

  /*******************************************************/
  /* Sort current combatants in pools */
  static getCombatantsPool() {
    let pools = { friendly: [], neutral: [], hostile: [] };
    game.combat.combatants.forEach((cbt) => {
      if (cbt.token.disposition == 1) {
        pools.friendly.push(cbt);
      }
      if (cbt.token.disposition == -1) {
        pools.hostile.push(cbt);
      }
      if (cbt.token.disposition == 0) {
        pools.neutral.push(cbt);
      }
    });
    return pools;
  }

  /*******************************************************/
  static combatTurn(combat, data, options) {
  }


  /*******************************************************/
  static combatRound(combat, data, options) {
    // Cleanup surprised effects 

  }

  /*******************************************************/
  static async preUpdateCombat(combat, data, diff, id) {
  }
}