import { sweepLeftovers } from './helpers/supabase'

// Belt-and-suspenders: even though every spec cleans up in its own finally block,
// sweep once more at the end so a mid-test crash can never leave prod data behind.
export default async function globalTeardown() {
  const swept = await sweepLeftovers()
  console.log(`[smoke] teardown sweep removed ${swept.rows} rows + ${swept.users} users`)
}
