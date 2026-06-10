import PostSeekerListingForm from '@/components/PostSeekerListingForm'

export default function NewSeekerListingPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Post a Seeking Listing</h1>
        <p className="mt-2 text-slate-500">
          Let aircraft owners know you&apos;re looking for a partnership. Describe what you&apos;re after
          and let them come to you.
        </p>
      </div>
      <PostSeekerListingForm />
    </div>
  )
}
