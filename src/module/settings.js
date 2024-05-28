export const registerSettings = () => {

  game.settings.register("acks", "enable-combatant-color", {
    name: game.i18n.localize("ACKS.Setting.enableCombatantColor"),
    hint: game.i18n.localize("ACKS.Setting.enableCombatantColorHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.acks.colorFriendlies = new window.Ardittristan.ColorSetting("acks", "color-friendlies", {
    name:  game.i18n.localize("ACKS.Setting.colorFriendlies"),           // The name of the setting in the settings menu
    hint: game.i18n.localize("ACKS.Setting.colorFriendlies"),        // A description of the registered setting and its behavior
    label: "Color Picker",              // The text label used in the button
    restricted: false,                  // Restrict this setting to gamemaster only?
    defaultColor: "#000000ff",          // The default color of the setting
    scope: "client",                    // The scope of the setting
    onChange: (value) => {},            // A callback function which triggers when the setting is changed
    insertAfter: "acks.enable-combatant-color"   // If supplied it will place the setting after the supplied setting
  });
  game.acks.colorHostiles  = new window.Ardittristan.ColorSetting("acks", "color-hostiles", {
    name:  game.i18n.localize("ACKS.Setting.colorHostiles"),           // The name of the setting in the settings menu
    hint: game.i18n.localize("ACKS.Setting.colorHostiles"),        // A description of the registered setting and its behavior
    label: "Color Picker",              // The text label used in the button
    restricted: false,                  // Restrict this setting to gamemaster only?
    defaultColor: "#000000ff",          // The default color of the setting
    scope: "client",                    // The scope of the setting
    onChange: (value) => {},            // A callback function which triggers when the setting is changed
    insertAfter: "acks.color-friendlies"   // If supplied it will place the setting after the supplied setting
  });

  game.settings.register("acks", "initiative", {
    name: game.i18n.localize("ACKS.Setting.Initiative"),
    hint: game.i18n.localize("ACKS.Setting.InitiativeHint"),
    default: "individual",
    scope: "world",
    type: String,
    config: true,
    choices: {
      individual: "ACKS.Setting.InitiativeIndividual",
      group: "ACKS.Setting.InitiativeGroup",
    },
  });

  game.settings.register("acks", "initiativePersistence", {
    name: game.i18n.localize("ACKS.Setting.RerollInitiative"),
    hint: game.i18n.localize("ACKS.Setting.RerollInitiativeHint"),
    default: "reset",
    scope: "world",
    type: String,
    config: true,
    choices: {
      keep: "ACKS.Setting.InitiativeKeep",
      reset: "ACKS.Setting.InitiativeReset",
      reroll: "ACKS.Setting.InitiativeReroll",
    }
  });

  game.settings.register("acks", "ascendingAC", {
    name: game.i18n.localize("ACKS.Setting.AscendingAC"),
    hint: game.i18n.localize("ACKS.Setting.AscendingACHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: false,
    onChange: _ => window.location.reload()
  });

  game.settings.register("acks", "encumbranceOption", {
    name: game.i18n.localize("ACKS.Setting.Encumbrance"),
    hint: game.i18n.localize("ACKS.Setting.EncumbranceHint"),
    default: "detailed",
    scope: "world",
    type: String,
    config: true,
    choices: {
      detailed: "ACKS.Setting.EncumbranceDetailed",
      complete: "ACKS.Setting.EncumbranceComplete",
    },
    onChange: _ => window.location.reload()
  });

  game.settings.register("acks", "morale", {
    name: game.i18n.localize("ACKS.Setting.Morale"),
    hint: game.i18n.localize("ACKS.Setting.MoraleHint"),
    default: true,
    scope: "world",
    type: Boolean,
    config: true,
  });

  game.settings.register("acks", "removeMagicBonus", {
    name: game.i18n.localize("ACKS.Setting.RemoveMagicBonus"),
    hint: game.i18n.localize("ACKS.Setting.RemoveMagicBonusHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.settings.register("acks", "exploding20s", {
    name: game.i18n.localize("ACKS.Setting.Explode20"),
    hint: game.i18n.localize("ACKS.Setting.Explode20Hint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });

  game.settings.register("acks", "bhr", {
    name: game.i18n.localize("ACKS.Setting.BHR"),
    hint: game.i18n.localize("ACKS.Setting.BHRHint"),
    default: false,
    scope: "world",
    type: Boolean,
    config: true,
    onChange: _ => window.location.reload()
  });
}