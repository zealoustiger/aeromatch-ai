/**
 * Pure financial-calculator math for ClubHanger's decision tools.
 *
 * No DB, no React — just numbers in, numbers out, so the same functions back both
 * the standalone /tools pages and the compact embeds, and are unit-testable.
 * All money values are whole USD (matching the listing schema).
 */

/** Map a share type to the ownership fraction it represents (null when not fractional). */
export function shareFractionFromType(shareType: string | null | undefined): number | null {
  switch (shareType) {
    case '1/2':
      return 1 / 2
    case '1/3':
      return 1 / 3
    case '1/4':
      return 1 / 4
    default:
      return null
  }
}

export interface CostInputs {
  /** One-time buy-in for this share (USD). */
  buyIn: number
  /** This pilot's monthly fixed cost share (USD/mo). */
  monthlyFixed: number
  /** Wet (fuel-inclusive) hourly rate (USD/hr). */
  hourlyWet: number
  /** Expected hours flown per month. */
  hoursPerMonth: number
  /** Fraction of the aircraft this share represents (e.g. 1/3). Used for the full-ownership comparison. */
  shareFraction?: number | null
  /** Annual opportunity cost rate applied to the buy-in capital (e.g. 0.05). Default 0. */
  capitalRate?: number
  /** Comparable hourly rental/club rate for the "vs. renting" comparison (USD/hr). */
  rentalRate?: number
}

export interface CostResult {
  /** Operating cost per month (fixed + hourly), excluding capital. */
  operatingMonthly: number
  /** Operating cost + monthly opportunity cost of the buy-in capital. */
  allInMonthly: number
  /** allInMonthly × 12. */
  annual: number
  /** True $/hr including fixed costs spread over the flown hours. */
  trueCostPerHour: number
  /** Monthly cost of flying the same hours at the comparable rental rate. */
  rentingMonthly: number
  /** Positive = partnership saves this much vs. renting each month. */
  vsRentingMonthlySavings: number
  /** Estimated monthly cost of sole ownership flying the same hours (null if share unknown). */
  fullOwnershipMonthly: number | null
  /** Positive = partnership saves this much vs. full ownership each month (null if share unknown). */
  vsFullOwnershipMonthlySavings: number | null
}

export function computeCost(input: CostInputs): CostResult {
  const buyIn = Math.max(0, input.buyIn || 0)
  const monthlyFixed = Math.max(0, input.monthlyFixed || 0)
  const hourlyWet = Math.max(0, input.hourlyWet || 0)
  const hours = Math.max(0, input.hoursPerMonth || 0)
  const capitalRate = Math.max(0, input.capitalRate ?? 0)
  const rentalRate = Math.max(0, input.rentalRate ?? 0)
  const frac = input.shareFraction ?? null

  const operatingMonthly = monthlyFixed + hourlyWet * hours
  const capitalMonthly = (buyIn * capitalRate) / 12
  const allInMonthly = operatingMonthly + capitalMonthly
  const annual = allInMonthly * 12
  const trueCostPerHour = hours > 0 ? operatingMonthly / hours : hourlyWet

  const rentingMonthly = rentalRate * hours
  const vsRentingMonthlySavings = rentingMonthly - operatingMonthly

  // Full ownership: the same hourly, but you carry ALL of the fixed cost
  // (your share's fixed scaled up by 1/fraction).
  let fullOwnershipMonthly: number | null = null
  let vsFullOwnershipMonthlySavings: number | null = null
  if (frac && frac > 0) {
    const fullFixed = monthlyFixed / frac
    fullOwnershipMonthly = fullFixed + hourlyWet * hours
    vsFullOwnershipMonthlySavings = fullOwnershipMonthly - operatingMonthly
  }

  return {
    operatingMonthly,
    allInMonthly,
    annual,
    trueCostPerHour,
    rentingMonthly,
    vsRentingMonthlySavings,
    fullOwnershipMonthly,
    vsFullOwnershipMonthlySavings,
  }
}

/**
 * Transparent rule-of-thumb estimate of annual/monthly cost to OWN a piston single
 * outright, derived from its asking price. Only the insurance line scales with the
 * listing (hull value); hangar, annual inspection, and operating are clearly-labeled
 * typical figures so nothing is presented as listing-specific that isn't. This is a
 * decision-support estimate (the Zillow "estimated payment" analog), not a quote —
 * callers must show the disclaimer + breakdown. All money is whole USD/yr unless noted.
 */
export interface OwnershipEstimate {
  /** Annual hull insurance — 1% of asking price, floored so cheap hulls aren't ~$0. */
  insuranceAnnual: number
  /** Typical annual hangar / tie-down. */
  hangarAnnual: number
  /** Typical annual inspection for a simple piston single. */
  annualInspection: number
  /** Operating (fuel + oil + maintenance reserves) for the assumed hours below. */
  operatingAnnual: number
  /** Hours/yr assumed for the operating figure. */
  hoursPerYear: number
  /** Assumed all-in operating rate (USD/hr). */
  operatingPerHour: number
  /** Sum of the four annual lines. */
  totalAnnual: number
  /** totalAnnual / 12. */
  totalMonthly: number
}

export function estimateOwnershipCost(askingPrice: number): OwnershipEstimate {
  const hull = Math.max(0, askingPrice || 0)
  // 1% of hull value is a conservative full-coverage figure for a typical piston
  // single; floor at $1,000 so a cheap hull doesn't read as near-free to insure.
  const insuranceAnnual = Math.max(1000, Math.round((hull * 0.01) / 100) * 100)
  const hangarAnnual = 3000
  const annualInspection = 2000
  const hoursPerYear = 75
  const operatingPerHour = 150
  const operatingAnnual = hoursPerYear * operatingPerHour
  const totalAnnual = insuranceAnnual + hangarAnnual + annualInspection + operatingAnnual
  return {
    insuranceAnnual,
    hangarAnnual,
    annualInspection,
    operatingAnnual,
    hoursPerYear,
    operatingPerHour,
    totalAnnual,
    totalMonthly: totalAnnual / 12,
  }
}

export interface EarningsInputs {
  /** Full aircraft monthly fixed cost the owner carries today (USD/mo). */
  monthlyFixedTotal: number
  /** One-time buy-in charged to each partner (USD). */
  sharePrice: number
  /** Number of partners (shares) brought in. */
  sharesOffered: number
  /** Monthly fixed dues each partner pays the owner (USD/mo). */
  monthlyDuesPerShare: number
  /** Wet rate charged to partners (USD/hr). */
  hourlyWet: number
  /** Owner's variable cost per flown hour — fuel/oil/reserves (USD/hr). */
  hourlyCost: number
  /** Average hours each partner flies per month. */
  expectedHoursPerShare: number
}

export interface EarningsResult {
  /** Monthly income from partner dues. */
  monthlyDuesIncome: number
  /** Monthly margin from partner flying (wet − cost) × partner-hours. */
  monthlyHourlyMargin: number
  /** Total monthly offset/earnings to the owner. */
  monthlyOffset: number
  /** monthlyOffset × 12. */
  annualOffset: number
  /** One-time capital collected from buy-ins. */
  upfrontFromBuyIns: number
  /** Share of the owner's fixed cost covered by dues (0–1+). */
  fixedCoverage: number
  /** Owner's net monthly fixed burden after dues (negative = net positive). */
  netMonthlyFixedAfterDues: number
  /** Partners needed for dues alone to fully cover the owner's fixed cost. */
  partnersToBreakEvenFixed: number | null
}

export function computeEarnings(input: EarningsInputs): EarningsResult {
  const monthlyFixedTotal = Math.max(0, input.monthlyFixedTotal || 0)
  const sharePrice = Math.max(0, input.sharePrice || 0)
  const shares = Math.max(0, Math.floor(input.sharesOffered || 0))
  const duesPerShare = Math.max(0, input.monthlyDuesPerShare || 0)
  const hourlyWet = Math.max(0, input.hourlyWet || 0)
  const hourlyCost = Math.max(0, input.hourlyCost || 0)
  const hoursPerShare = Math.max(0, input.expectedHoursPerShare || 0)

  const monthlyDuesIncome = shares * duesPerShare
  const monthlyHourlyMargin = (hourlyWet - hourlyCost) * shares * hoursPerShare
  const monthlyOffset = monthlyDuesIncome + monthlyHourlyMargin
  const annualOffset = monthlyOffset * 12
  const upfrontFromBuyIns = shares * sharePrice
  const fixedCoverage = monthlyFixedTotal > 0 ? monthlyDuesIncome / monthlyFixedTotal : 0
  const netMonthlyFixedAfterDues = monthlyFixedTotal - monthlyDuesIncome
  const partnersToBreakEvenFixed = duesPerShare > 0 ? Math.ceil(monthlyFixedTotal / duesPerShare) : null

  return {
    monthlyDuesIncome,
    monthlyHourlyMargin,
    monthlyOffset,
    annualOffset,
    upfrontFromBuyIns,
    fixedCoverage,
    netMonthlyFixedAfterDues,
    partnersToBreakEvenFixed,
  }
}
