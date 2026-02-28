'use client'

import { useState, useEffect } from 'react'
import type { PendingJobApplication } from '@/lib/data'
import { getJobApplicationById, submitRecruiterCall } from '@/lib/data'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { CALL_STATUS_SELECT_OPTIONS } from '@/lib/constants'

interface RecruiterCallModalProps {
  applicationId: number | null
  initialApplication?: PendingJobApplication | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RecruiterCallModal({
  applicationId,
  initialApplication,
  isOpen,
  onClose,
  onSuccess,
}: RecruiterCallModalProps) {
  const [application, setApplication] = useState<PendingJobApplication | null>(initialApplication ?? null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [callDate, setCallDate] = useState('')
  const [callStatus, setCallStatus] = useState('')
  const [interested, setInterested] = useState<boolean | ''>('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showMoreDetails, setShowMoreDetails] = useState(false)

  useEffect(() => {
    if (callStatus !== 'Connected') setInterested('')
  }, [callStatus])

  useEffect(() => {
    if (!isOpen) return
    setCallDate('')
    setCallStatus('')
    setInterested('')
    setSubmitError(null)
    setFetchError(null)
    setShowMoreDetails(false)
    if (applicationId != null && !initialApplication) {
      setLoading(true)
      getJobApplicationById(applicationId)
        .then(setApplication)
        .catch((e) => setFetchError(e instanceof Error ? e.message : 'Failed to load application'))
        .finally(() => setLoading(false))
    } else if (initialApplication) {
      setApplication(initialApplication)
    } else {
      setApplication(null)
    }
  }, [isOpen, applicationId, initialApplication])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (applicationId == null) return
    const date = callDate.trim()
    const status = callStatus.trim()
    const isCallConnected = status === 'Connected'
    const hasInterested = interested === true || interested === false
    if (!date || !status) {
      setSubmitError('Please fill Call Date and Call Status.')
      return
    }
    if (isCallConnected && !hasInterested) {
      setSubmitError('When call is connected, please select whether the candidate is Interested (Yes/No).')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitRecruiterCall(applicationId, {
        callDate: date,
        callStatus: status,
        interested: hasInterested ? (interested as boolean) : null,
      })
      onSuccess()
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const candidateName =
    application?.user &&
    [application.user.firstName, application.user.lastName].filter(Boolean).join(' ')
  const phoneUser = application?.user?.phone
  const phoneProfile = application?.user?.profile?.phone
  const callConnected = callStatus === 'Connected'
  const jobTitle = application?.job?.title ?? ''
  const companyName = application?.job?.company?.name ?? ''
  const hasMoreDetails =
    application?.user?.email ||
    application?.user?.location ||
    application?.user?.profile?.education ||
    (application?.user?.profile?.skills?.length ?? 0) > 0 ||
    application?.expectedSalary ||
    application?.resume ||
    application?.coverLetter ||
    application?.appliedAt

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Recruiter call details</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Fill call date, status, and interest to move this application out of pending.
          </p>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading...</div>
          ) : fetchError ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-red-800 text-sm">{fetchError}</div>
          ) : application ? (
            <>
              <div className="mb-4 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
                <p className="font-medium text-gray-900">{candidateName || 'Candidate'}</p>
                {(phoneUser || phoneProfile) && (
                  <div className="mt-1 space-y-0.5 text-gray-700">
                    {phoneUser && (
                      <p>
                        <span className="font-medium text-gray-600">Phone (account):</span>{' '}
                        <a href={`tel:${phoneUser}`} className="text-primary-600 hover:underline">{phoneUser}</a>
                      </p>
                    )}
                    {phoneProfile && (
                      <p>
                        <span className="font-medium text-gray-600">Phone (profile):</span>{' '}
                        <a href={`tel:${phoneProfile}`} className="text-primary-600 hover:underline">{phoneProfile}</a>
                      </p>
                    )}
                    {phoneUser && phoneProfile && phoneUser === phoneProfile && (
                      <p className="text-xs text-gray-500">Same number on account and profile</p>
                    )}
                  </div>
                )}
                {!phoneUser && !phoneProfile && (
                  <p className="mt-1 text-gray-500">No phone number in response</p>
                )}
                <p className="mt-2 text-gray-700">
                  Applied for: <span className="font-medium">{jobTitle}</span>
                  {companyName && ` at ${companyName}`}
                </p>
                {hasMoreDetails && (
                  <button
                    type="button"
                    onClick={() => setShowMoreDetails((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-primary-600 hover:underline text-left"
                  >
                    {showMoreDetails ? (
                      <>▼ Show less</>
                    ) : (
                      <>▶ Show more details</>
                    )}
                  </button>
                )}
                {showMoreDetails && hasMoreDetails && (
                  <div className="mt-3 pt-3 border-t border-gray-200 space-y-1.5 text-gray-600">
                    {application.user?.email && (
                      <p><span className="font-medium text-gray-600">Email:</span> {application.user.email}</p>
                    )}
                    {application.user?.location && (
                      <p><span className="font-medium text-gray-600">Location:</span> {application.user.location}</p>
                    )}
                    {application.user?.profile?.education && (
                      <p><span className="font-medium text-gray-600">Education:</span> {application.user.profile.education}</p>
                    )}
                    {application.user?.profile?.skills?.length ? (
                      <p>
                        <span className="font-medium text-gray-600">Skills:</span>{' '}
                        {application.user.profile.skills.join(', ')}
                      </p>
                    ) : null}
                    {application.expectedSalary && (
                      <p><span className="font-medium text-gray-600">Expected salary:</span> {application.expectedSalary}</p>
                    )}
                    {application.appliedAt && (
                      <p><span className="font-medium text-gray-600">Applied at:</span> {new Date(application.appliedAt).toLocaleString()}</p>
                    )}
                    {application.coverLetter && (
                      <p><span className="font-medium text-gray-600">Cover letter:</span> {application.coverLetter}</p>
                    )}
                    {application.resume && (
                      <a
                        href={application.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-primary-600 hover:underline"
                      >
                        View resume
                      </a>
                    )}
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Call Date *</label>
                  <Input
                    type="date"
                    value={callDate}
                    onChange={(e) => setCallDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Call Status *</label>
                  <Select
                    value={callStatus}
                    onChange={(e) => setCallStatus(e.target.value)}
                    options={[{ value: '', label: 'Select...' }, ...CALL_STATUS_SELECT_OPTIONS]}
                    required
                  />
                </div>
                {callConnected && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Interested *</label>
                    <Select
                      value={interested === '' ? '' : interested ? 'yes' : 'no'}
                      onChange={(e) => {
                        const v = e.target.value
                        setInterested(v === '' ? '' : v === 'yes' ? true : v === 'no' ? false : '')
                      }}
                      options={[
                        { value: '', label: 'Select...' },
                        { value: 'yes', label: 'Yes' },
                        { value: 'no', label: 'No' },
                      ]}
                      required
                    />
                  </div>
                )}
                {submitError && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">{submitError}</div>
                )}
                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-4 text-gray-500">No application selected.</div>
          )}
        </div>
      </div>
    </div>
  )
}
