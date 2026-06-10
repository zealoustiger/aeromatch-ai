import PostPartnershipForm from '@/components/PostPartnershipForm'

export default function NewPartnershipPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Post a Partnership</h1>
        <p className="mt-2 text-slate-500">
          List your aircraft partnership for free. Reach pilots searching in your area.
        </p>
      </div>
      <PostPartnershipForm />
    </div>
  )
}
