import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy | Edu by Castor AI',
  description: 'How Edu by Castor AI collects, uses, and protects personal information.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      summary="This policy explains what information Edu collects, why we use it, and the choices available to you."
      sections={[
        {
          title: '1. Who we are',
          content: (
            <p>
              Castor AI operates Edu, a skills-assessment service available at{' '}
              <a href="https://edu.castorai.in">edu.castorai.in</a>. In this policy, “Edu,” “we,”
              “us,” and “our” refer to Castor AI and the Edu service.
            </p>
          ),
        },
        {
          title: '2. Information we collect',
          content: (
            <>
              <p>Depending on how you use Edu, we collect:</p>
              <ul>
                <li>
                  <strong>Account information:</strong> your name and email address. If you create
                  an account with a password, we store a securely hashed version of the password,
                  not the readable password itself.
                </li>
                <li>
                  <strong>Profile information:</strong> company name, country, state or region,
                  city, professional background, years of experience, and an optional LinkedIn URL.
                </li>
                <li>
                  <strong>Assessment information:</strong> selected assessment domain, attempt
                  records, scores, completion times, and timestamps.
                </li>
                <li>
                  <strong>Usage and technical information:</strong> pages visited, actions taken in
                  the assessment flow, a session identifier, browser or device information, and
                  related performance and diagnostic information.
                </li>
              </ul>
              <p>
                When you choose Google sign-in, Google provides basic identity information such as
                your name and email address. Edu does not receive your Google password.
              </p>
            </>
          ),
        },
        {
          title: '3. How we use information',
          content: (
            <ul>
              <li>Provide and secure your account and authenticate sign-ins.</li>
              <li>Deliver assessments, calculate scores, and show progress and certificates.</li>
              <li>Produce leaderboards and peer comparisons.</li>
              <li>Understand product usage, diagnose problems, and improve Edu.</li>
              <li>Prevent fraud, abuse, and unauthorized access.</li>
              <li>Respond to support, privacy, and legal requests.</li>
            </ul>
          ),
        },
        {
          title: '4. Community statistics and leaderboards',
          content: (
            <p>
              Edu may show your display name and assessment score to signed-in users on a
              leaderboard. Profile characteristics such as location, background, and experience
              are used for peer comparisons and are presented in aggregated groups where
              practical. Do not add information to your profile that you do not want used for
              these features.
            </p>
          ),
        },
        {
          title: '5. Service providers and sharing',
          content: (
            <>
              <p>
                We use service providers to operate Edu, including Google for optional sign-in,
                Supabase for database hosting, and Vercel for application hosting, analytics, and
                performance monitoring. These providers process information on our behalf under
                their own terms and privacy commitments.
              </p>
              <p>
                We do not sell your personal information. We may disclose information when needed
                to comply with law, protect users or the service, investigate abuse, or complete a
                business reorganization subject to appropriate safeguards.
              </p>
            </>
          ),
        },
        {
          title: '6. Cookies and similar technology',
          content: (
            <p>
              Edu uses cookies or similar browser storage to keep you signed in, remember interface
              preferences, group events from the same browser session, measure site usage, and
              monitor performance. Blocking essential storage may prevent account or interface
              features from working correctly.
            </p>
          ),
        },
        {
          title: '7. Retention and your choices',
          content: (
            <p>
              We retain information for as long as reasonably needed to provide and secure Edu,
              maintain necessary business records, and meet legal obligations. You may ask us to
              access, correct, or delete your personal information by contacting us. We may need to
              verify your identity, and some records may be retained where legally required.
            </p>
          ),
        },
        {
          title: '8. Security and international processing',
          content: (
            <p>
              We use reasonable technical and organizational safeguards, but no online service can
              guarantee absolute security. Our providers may process information in countries
              other than your own, subject to the protections required by applicable law.
            </p>
          ),
        },
        {
          title: '9. Children’s privacy',
          content: (
            <p>
              Edu is not directed to children under 13, and we do not knowingly collect personal
              information from children under 13. Contact us if you believe a child has provided
              information to Edu without appropriate permission.
            </p>
          ),
        },
        {
          title: '10. Changes and contact',
          content: (
            <>
              <p>
                We may update this policy as Edu evolves. We will update the effective date on this
                page when we make changes.
              </p>
              <p>
                For privacy questions or requests, email{' '}
                <a href="mailto:castorai.admin@gmail.com">castorai.admin@gmail.com</a>.
              </p>
            </>
          ),
        },
      ]}
    />
  )
}
