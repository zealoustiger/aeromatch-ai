/**
 * Worked-example tests for the financial calculators.
 * Run: node --experimental-strip-types --test src/lib/calculators.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCost, computeEarnings, estimateShareCosts, shareFractionFromType } from './calculators.ts'

test('shareFractionFromType maps fractional shares', () => {
  assert.equal(shareFractionFromType('1/3'), 1 / 3)
  assert.equal(shareFractionFromType('1/2'), 0.5)
  assert.equal(shareFractionFromType('leaseback'), null)
})

test('cost calculator — 1/3 C172 share worked example', () => {
  const r = computeCost({
    buyIn: 18000,
    monthlyFixed: 320,
    hourlyWet: 85,
    hoursPerMonth: 10,
    shareFraction: 1 / 3,
    capitalRate: 0.05,
    rentalRate: 160,
  })
  assert.equal(r.operatingMonthly, 1170)
  assert.equal(r.allInMonthly, 1245) // + $75/mo capital opportunity cost on $18k @5%
  assert.equal(r.annual, 14940)
  assert.equal(r.trueCostPerHour, 117)
  assert.equal(r.rentingMonthly, 1600)
  assert.equal(r.vsRentingMonthlySavings, 430)
  assert.equal(Math.round(r.fullOwnershipMonthly!), 1810)
  assert.equal(Math.round(r.vsFullOwnershipMonthlySavings!), 640)
})

test('cost calculator — zero hours falls back to wet rate for $/hr, no divide-by-zero', () => {
  const r = computeCost({ buyIn: 0, monthlyFixed: 300, hourlyWet: 90, hoursPerMonth: 0 })
  assert.equal(r.operatingMonthly, 300)
  assert.equal(r.trueCostPerHour, 90)
  assert.equal(r.fullOwnershipMonthly, null) // no share fraction provided
})

test('estimateShareCosts — buy-in per share is asking price ÷ shares', () => {
  const rows = estimateShareCosts(300_000)
  const byShares = Object.fromEntries(rows.map((r) => [r.shares, r.buyInPerShare]))
  assert.equal(byShares[1], 300_000) // sole owner buys in at the full asking price
  assert.equal(byShares[2], 150_000)
  assert.equal(byShares[3], 100_000)
  assert.equal(byShares[4], 75_000)
})

test('earnings calculator — owner offering 2 shares worked example', () => {
  const r = computeEarnings({
    monthlyFixedTotal: 960,
    sharePrice: 18000,
    sharesOffered: 2,
    monthlyDuesPerShare: 320,
    hourlyWet: 85,
    hourlyCost: 55,
    expectedHoursPerShare: 10,
  })
  assert.equal(r.monthlyDuesIncome, 640)
  assert.equal(r.monthlyHourlyMargin, 600)
  assert.equal(r.monthlyOffset, 1240)
  assert.equal(r.annualOffset, 14880)
  assert.equal(r.upfrontFromBuyIns, 36000)
  assert.ok(Math.abs(r.fixedCoverage - 0.6667) < 0.001)
  assert.equal(r.netMonthlyFixedAfterDues, 320)
  assert.equal(r.partnersToBreakEvenFixed, 3)
})
