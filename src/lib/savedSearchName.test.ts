/**
 * Worked-example tests for the saved-search auto-namer.
 * Run: node --experimental-strip-types --test src/lib/savedSearchName.test.ts
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { autoNameSearch } from './savedSearchName.ts'

test('aircraft: make + model + state + max price', () => {
  assert.equal(
    autoNameSearch('make=Cessna&model=172&state=ca&max_price=80000', '/aircraft'),
    'Cessna 172 for sale in CA under $80k'
  )
})

test('aircraft: bare query → generic label', () => {
  assert.equal(autoNameSearch('', '/aircraft'), 'Aircraft for sale')
})

test('aircraft: year floor, total-time ceiling, price drops', () => {
  assert.equal(
    autoNameSearch('make=Cirrus&min_year=2010&max_tt=1500&drops=1', '/aircraft'),
    'Cirrus for sale 2010+, under 1,500 hrs, price drops'
  )
})

test('partnership: make + airport near', () => {
  assert.equal(
    autoNameSearch('make=Cirrus&airport=khwd&radius=100', '/partnerships'),
    'Cirrus partnerships within 100mi of KHWD'
  )
})

test('partnership: multi-airport + monthly + buy-in', () => {
  assert.equal(
    autoNameSearch('airports=khwd,koak&max_monthly=400&max_buyin=20000', '/partnerships'),
    'Partnerships near KHWD,KOAK · under $400/mo, buy-in under $20k'
  )
})

test('partnership: bare query → generic label', () => {
  assert.equal(autoNameSearch('', '/partnerships'), 'Partnerships')
})

test('compact money: millions render with M', () => {
  assert.equal(
    autoNameSearch('make=Cirrus&max_price=1200000', '/aircraft'),
    'Cirrus for sale under $1.2M'
  )
})

test('name is clamped to a sane length', () => {
  const long = autoNameSearch('make=' + 'x'.repeat(200), '/aircraft')
  assert.ok(long.length <= 80, `expected ≤80, got ${long.length}`)
})

test('seeker: make + airports + rating + hours', () => {
  assert.equal(
    autoNameSearch('make=Cessna&airports=kpao,khwd&rating=PPL,IFR&min_hours=250', '/partnerships/seeking'),
    'Cessna seekers near KPAO,KHWD · PPL,IFR, 250+ hrs'
  )
})

test('seeker: single airport + share type', () => {
  assert.equal(
    autoNameSearch('airports=kaus&share_type=1%2F2', '/partnerships/seeking'),
    'Seekers near KAUS · 1/2'
  )
})

test('seeker: bare query → generic label', () => {
  assert.equal(autoNameSearch('', '/partnerships/seeking'), 'Seekers')
})
