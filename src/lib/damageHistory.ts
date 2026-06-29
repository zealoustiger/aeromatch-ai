/**
 * Damage-history buyer read — a proprietary, honesty-gated synthesis of the
 * `damage_history` boolean into a buyer decision a non-expert shopper actually
 * wants: "what does this flag mean, and what should I ask?"
 *
 * Listing sites either bury the damage flag or omit it entirely; we surface it as
 * structured guidance tied to a real pre-buy workflow. Honesty rules:
 *   - `damage_history` is extracted from the seller's free-text description, so it
 *     reflects what the LISTING states, not a verified logbook fact. All copy is
 *     framed as "reported" / "the listing reports", never as a guarantee.
 *   - `null` (unknown / not extracted) self-suppresses — we never assert "no damage"
 *     from the absence of a flag. A confident-but-wrong claim here is a loss.
 *   - No fabricated dollar figure: damage's effect on value/insurability is real but
 *     unquantifiable from a boolean, so we say so qualitatively and stop.
 */

export type DamageState = 'clean' | 'reported'

export interface DamageHistoryResult {
  state: DamageState
  /** Short chip label. */
  label: string
  headline: string
  detail: string
}

export function computeDamageHistory(
  damageHistory: boolean | null | undefined,
): DamageHistoryResult | null {
  // Unknown / not extracted → suppress. Never infer "no damage" from a missing flag.
  if (typeof damageHistory !== 'boolean') return null

  if (damageHistory === false) {
    return {
      state: 'clean',
      label: 'None reported',
      headline: 'No damage history reported',
      detail:
        'This listing reports no prior damage. That is a positive sign, but the flag ' +
        'reflects the seller’s description, not the logbooks — confirm it during a ' +
        'pre-buy. Undocumented or unrepaired damage is a classic red flag, so have an ' +
        'independent inspector review the airframe and engine records before you commit.',
    }
  }

  return {
    state: 'reported',
    label: 'Reported',
    headline: 'Prior damage reported',
    detail:
      'This listing reports prior damage. Properly repaired damage does not automatically ' +
      'disqualify an aircraft, but it can affect value, insurability, and resale. Ask the ' +
      'seller for the repair records (and any FAA Form 337s / STCs), and have a pre-buy ' +
      'inspection focus on the repaired area and the surrounding structure.',
  }
}
