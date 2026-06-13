import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SITE_URL } from '@/lib/seo'
import BookmarkletLink from '@/components/BookmarkletLink'

export const metadata = { title: 'Bookmarklet', robots: { index: false } }
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

// The bookmarklet: reads the FB post's text + content images, opens our capture
// page with the payload in the URL hash (sidesteps Facebook's CSP/CORS).
function buildBookmarklet(siteUrl: string): string {
  const src = `(function(){
    var art=document.querySelector('[role=article]')||document.body;
    var text=(window.getSelection&&String(window.getSelection()))||'';
    if(text.trim().length<10){text=art.innerText||'';}
    var imgs=[].slice.call(art.querySelectorAll('img')).filter(function(i){
      return i.naturalWidth>=350&&i.naturalHeight>=350&&/scontent|fbcdn/.test(i.src);
    }).map(function(i){return i.src;});
    imgs=imgs.filter(function(v,idx){return imgs.indexOf(v)===idx;}).slice(0,10);
    if(!text.trim()&&!imgs.length){alert('ClubHanger: no post text or images found. Select the post text first, then click again.');return;}
    var p={text:text,imageUrls:imgs,postUrl:location.href};
    window.open('${siteUrl}/admin/capture#'+encodeURIComponent(JSON.stringify(p)),'_blank');
  })();`
  return 'javascript:' + encodeURIComponent(src.replace(/\s*\n\s*/g, ''))
}

export default async function BookmarkletPage() {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getUser()
  const email = data.user?.email?.toLowerCase()
  const allowed = email && (ADMIN_EMAILS.length === 0 || ADMIN_EMAILS.includes(email))

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Admin only</h1>
        <Link href="/auth?next=/admin/bookmarklet" className="mt-4 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
          Sign in
        </Link>
      </div>
    )
  }

  const code = buildBookmarklet(SITE_URL)

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900">Facebook capture bookmarklet</h1>
      <p className="mt-2 text-slate-500">
        Drag the button below to your browser’s bookmarks bar. Then, on any Facebook group post,
        click it to capture the text and photos into ClubHanger.
      </p>

      <div className="my-8 rounded-xl border border-slate-200 bg-white p-6">
        <BookmarkletLink code={code} />
        <p className="mt-4 text-xs text-slate-400">
          Drag it to your bookmarks bar (don’t click it here). If dragging doesn’t work, click “Copy
          code instead,” make a new bookmark, and paste it as the URL.
        </p>
      </div>

      <ol className="space-y-3 text-sm text-slate-600">
        <li>
          <strong className="text-slate-900">1.</strong> Open a partnership post in your Facebook
          group. Click into it so all photos load.
        </li>
        <li>
          <strong className="text-slate-900">2.</strong> (Optional but best) Select the post’s text
          with your mouse — it captures the selection most reliably.
        </li>
        <li>
          <strong className="text-slate-900">3.</strong> Click the <em>Save to ClubHanger</em>{' '}
          bookmark. A ClubHanger tab opens, re-hosts the images, and saves a draft.
        </li>
        <li>
          <strong className="text-slate-900">4.</strong> Go to{' '}
          <Link href="/admin/review" className="font-medium text-sky-600 hover:text-sky-700">
            Review &amp; publish
          </Link>{' '}
          to confirm the parsed fields and make it live.
        </li>
      </ol>

      <p className="mt-8 rounded-lg bg-amber-50 p-4 text-xs text-amber-800 ring-1 ring-amber-200">
        You must be signed in to ClubHanger as an admin in the same browser. If a capture says
        “sign in,” sign in once and it’ll work for the rest of your session.
      </p>
    </div>
  )
}
