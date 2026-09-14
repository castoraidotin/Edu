import type { Metadata } from 'next'
import LegalPage from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service | Edu by Castor AI',
  description: 'Terms governing the use of Edu by Castor AI.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      summary="These terms govern your access to and use of Edu. By using the service, you agree to these terms."
      sections={[
        {
          title: '1. The service',
          content: (
            <p>
              Castor AI provides Edu as a skills-assessment and benchmarking service. Edu offers
              quizzes, scores, progress information, peer comparisons, and related educational
              features. Features may change as we improve the service.
            </p>
          ),
        },
        {
          title: '2. Your account',
          content: (
            <p>
              You must provide accurate information, keep your sign-in credentials secure, and
              promptly notify us if you believe your account has been compromised. You are
              responsible for activity performed through your account.
            </p>
          ),
        },
        {
          title: '3. Acceptable use',
          content: (
            <>
              <p>You may not:</p>
              <ul>
                <li>Use Edu unlawfully or to harm, harass, or deceive others.</li>
                <li>Interfere with the service, bypass security controls, or probe for vulnerabilities.</li>
                <li>Automate quiz submissions, manipulate scores, or misrepresent assessment results.</li>
                <li>Copy, scrape, or redistribute substantial parts of Edu without permission.</li>
                <li>Use another person’s account without authorization.</li>
              </ul>
            </>
          ),
        },
        {
          title: '4. Assessment results',
          content: (
            <p>
              Edu results are informational benchmarks, not professional certifications,
              employment guarantees, or definitive measures of ability. You and any organization
              relying on a result should apply independent judgment. We do not guarantee that every
              question, score, comparison, or recommendation is complete or error-free.
            </p>
          ),
        },
        {
          title: '5. Content and intellectual property',
          content: (
            <p>
              Edu, including its software, design, questions, branding, and other service content,
              is owned by Castor AI or its licensors and is protected by applicable intellectual
              property laws. These terms grant you a limited, personal, non-exclusive, revocable
              right to use Edu for its intended purpose. They do not transfer ownership to you.
            </p>
          ),
        },
        {
          title: '6. Third-party services',
          content: (
            <p>
              Edu relies on third-party services, including Google sign-in and infrastructure
              providers. Your use of those services may also be governed by their terms. We are not
              responsible for third-party services that we do not control.
            </p>
          ),
        },
        {
          title: '7. Availability and account action',
          content: (
            <p>
              We may update, suspend, or discontinue all or part of Edu, including for maintenance,
              security, legal, or operational reasons. We may restrict or terminate access when a
              user violates these terms, creates risk for others, or threatens the service.
            </p>
          ),
        },
        {
          title: '8. Disclaimers and liability',
          content: (
            <p>
              Edu is provided on an “as is” and “as available” basis to the extent permitted by law.
              We disclaim warranties not expressly stated in these terms. To the extent permitted
              by law, Castor AI will not be liable for indirect, incidental, special, consequential,
              or punitive damages, or for lost data, profits, or opportunities arising from your
              use of Edu. Nothing in these terms excludes liability that cannot legally be excluded.
            </p>
          ),
        },
        {
          title: '9. Changes to these terms',
          content: (
            <p>
              We may update these terms as Edu evolves. Updated terms become effective when posted
              with a new effective date. If you do not agree to an update, you should stop using
              Edu.
            </p>
          ),
        },
        {
          title: '10. Contact',
          content: (
            <p>
              Questions about these terms may be sent to{' '}
              <a href="mailto:castorai.admin@gmail.com">castorai.admin@gmail.com</a>.
            </p>
          ),
        },
      ]}
    />
  )
}
