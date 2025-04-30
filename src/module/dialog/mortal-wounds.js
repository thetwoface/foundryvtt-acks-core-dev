const __HIT_DICE_MOD = { "d6": 2, "d8": 4, "d10": 6, "d12": 8 }

export class AcksMortalWoundsDialog extends FormApplication {

  /* -------------------------------------------- */
  /*   * @param {number} hitPoints - The current hit points of the actor.
    *   * @param {number} hitPointsMax - The maximum hit points of the actor.
    *   * @returns {number} - The hit points modifier based on the current hit points.
    *
    * -------------------------------------------- */
  computeHitPointsModifier(hitPoints, hitPointsMax) {
    if (hitPoints >= 0) {
      return 5
    }
    if (hitPoints > -(hitPointsMax / 4) ) {
      return 0
    }
    if (hitPoints >  -(hitPointsMax / 2)) {
      return -2
    }
    if (hitPoints > -hitPointsMax) {
      return -5
    }
    if (hitPoints > -(hitPointsMax * 2)) {
      return -10
    }
    return -20
  }

  /* -------------------------------------------- */
  /*   * @param {object} mortalWoundsData - The data object containing the values for the dialog.
    *  *   @returns {number} - The final modifier for the mortal wounds roll.
    * -------------------------------------------- */
  updateDialogResult(mortalWoundsData) {
    let finalModifier = (mortalWoundsData.hasHeavyHelm ? 2 : 0) + mortalWoundsData.hitPointsModifier + mortalWoundsData.hitDiceModifier + mortalWoundsData.conModifier
    if (mortalWoundsData.horsetailApplied) {
      finalModifier += 2
    }
    finalModifier += Number(mortalWoundsData.healingProficiency)
    finalModifier += Number(mortalWoundsData.healingMagicLevel)
    finalModifier -= Number(Math.floor(mortalWoundsData.necromanticSpellLevel/2))
    finalModifier += Number(mortalWoundsData.treatmentTiming)
    finalModifier += (Number(mortalWoundsData.layingOnHands)) ? Math.floor(Number(mortalWoundsData.healerClassLevel/2)) : 0
    $("input[name='finalModifierValue']").val(finalModifier)
    return finalModifier
  }

  async init(actor) {

    let mortalWoundsData = {
      title: "Roll Mortal Wounds",
      hasHeavyHelm: actor.hasHeavyHelm(),
      hitDice: actor.getHitDice(),
      maxHitPoints: actor.getMaxHitPoints(),
      currentHitPoints: actor.getCurrentHitPoints(),
      conModifier: actor.getConModifier(),
      horsetailApplied: false,
      healingMagicLevel: 0,
      layingOnHands: false,
      healerClassLevel: 0,
      healingProficiency: 0,
      necromanticSpellLevel: 0,
      treatmentTiming: 2
    }
    mortalWoundsData.hitDiceModifier = __HIT_DICE_MOD[mortalWoundsData.hitDice.toLowerCase()] || 0
    mortalWoundsData.hitPointsModifier = this.computeHitPointsModifier(mortalWoundsData.currentHitPoints, mortalWoundsData.maxHitPoints)
    mortalWoundsData.finalModifier = this.updateDialogResult(mortalWoundsData)

    let content = await renderTemplate("systems/acks/templates/apps/mortal-wounds-dialog.html", mortalWoundsData)

    const dialogContext = await foundry.applications.api.DialogV2.wait({
      window: { title: mortalWoundsData.title },
      classes: ["acks", "dialog", "party-sheet", "app", "window-app"],
      content,
      buttons: [{
        action: "roll",
        label: "Roll Mortal Wound",
        default: true,
        callback: (event, button, dialog) => {
          const output = Array.from(button.form.elements).reduce((obj, input) => {
            if (input.name) obj[input.name] = input.value
            return obj
          }, {})
          return output
        },
      }, {
        action: "cancel",
        label: "Cancel"
      }],
      actions: {
        "toggle-horsetail": (event, button, dialog) => {
          mortalWoundsData.horsetailApplied = !mortalWoundsData.horsetailApplied
          $("input[name='horsetailModifier']").val(mortalWoundsData.horsetailApplied ? 2 : 0)
          this.updateDialogResult(mortalWoundsData)
        },
        "toggle-laying": (event, button, dialog) => {
          mortalWoundsData.layingOnHands = !mortalWoundsData.layingOnHands
          $(".healer-class-level-div").toggle(mortalWoundsData.layingOnHands)
          this.updateDialogResult(mortalWoundsData)
        },
      },
      render: (event, dialog) => {
        $(".healer-class-level-div").hide()
        $(".healing-magic-level").change(event => {
          mortalWoundsData.healingMagicLevel = Number(event.target.value)
          this.updateDialogResult(mortalWoundsData)
        })
        $(".healer-class-level").change(event => {
          mortalWoundsData.healerClassLevel = Number(event.target.value)
          this.updateDialogResult(mortalWoundsData)
        })
        $(".healing-proficiency").change(event => {
          mortalWoundsData.healingProficiency = Number(event.target.value)
          this.updateDialogResult(mortalWoundsData)
        })
        $(".necromantic-spell-level").change(event => {
          mortalWoundsData.necromanticSpellLevel = Number(event.target.value)
          this.updateDialogResult(mortalWoundsData)
        })
        $(".treatment-timing").change(event => {
          mortalWoundsData.treatmentTiming = Number(event.target.value)
          this.updateDialogResult(mortalWoundsData)
        })

      }
    })

  }
}
