import React from "react";
import { Icons } from "./ui/Icons";
interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-neutral-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] rounded-xl bg-surface shadow-2xl flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <h2 className="text-xl font-bold text-content-strong">
            Terms of Service
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-content-muted hover:bg-surface-muted hover:text-content-default transition-colors"
          >
            <Icons.Close className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-content-default leading-relaxed space-y-6">
          <div className="bg-warning-50 p-4 rounded-lg border border-warning-200 text-xs text-warning-800">
            <strong>IMPORTANT NOTICE:</strong> THIS APPLICATION IS A CLINICAL
            DOCUMENTATION ASSISTANT. IT DOES NOT PROVIDE MEDICAL ADVICE,
            DIAGNOSIS, OR TREATMENT RECOMMENDATIONS. USE OF THIS TOOL IS SUBJECT
            TO THE PROFESSIONAL MEDICAL JUDGMENT OF THE LICENSED PROVIDER.
          </div>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              1. Acceptance of Terms
            </h3>
            <p>
              By accessing or using the Clinsight application ("Service"), you
              agree to be bound by these Terms of Service ("Terms"). If you do
              not agree to these Terms, you may not use the Service. These Terms
              apply to all visitors, users, and others who access or use the
              Service.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              2. Medical Disclaimer
            </h3>
            <p>
              Clinsight uses artificial intelligence to assist in drafting
              medical documentation. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                The Service is a support tool designed to reduce administrative
                burden, not a replacement for professional medical training,
                judgment, or diagnosis.
              </li>
              <li>
                <strong>Verification Required:</strong> You are solely
                responsible for reviewing, editing, and verifying all generated
                content (including SOAP notes, plans, and summaries) for
                accuracy, completeness, and clinical appropriateness before
                finalizing any medical record.
              </li>
              <li>
                The Service may generate incorrect, incomplete, or misleading
                information ("hallucinations").
              </li>
              <li>
                Clinsight assumes no liability for any clinical decisions or
                patient outcomes resulting from the use of this Service.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              3. User Obligations & HIPAA Compliance
            </h3>
            <p>
              You represent and warrant that you are a licensed healthcare
              professional or authorized personnel. You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Use the Service in compliance with all applicable laws and
                regulations, including the Health Insurance Portability and
                Accountability Act (HIPAA).
              </li>
              <li>
                Ensure that you have the necessary rights and consents to input
                patient data into the Service.
              </li>
              <li>
                Not use the Service for any unlawful purpose or to transmit
                harmful code.
              </li>
              <li>Maintain the confidentiality of your access credentials.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              4. Intellectual Property
            </h3>
            <p>
              The Service and its original content (excluding data provided by
              you), features, and functionality are and will remain the
              exclusive property of Clinsight and its licensors. The clinical
              data you input and the medical records you generate remain your
              property or the property of your institution, subject to
              applicable laws.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              5. Limitation of Liability
            </h3>
            <p>
              To the maximum extent permitted by law, in no event shall
              Clinsight, its directors, employees, partners, agents, suppliers,
              or affiliates, be liable for any indirect, incidental, special,
              consequential, or punitive damages, including without limitation,
              loss of profits, data, use, goodwill, or other intangible losses,
              resulting from your access to or use of or inability to access or
              use the Service.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              6. Modifications to Service
            </h3>
            <p>
              We reserve the right to modify or discontinue, temporarily or
              permanently, the Service (or any part thereof) with or without
              notice. We shall not be liable to you or to any third party for
              any modification, suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              7. Governing Law
            </h3>
            <p>
              These Terms shall be governed and construed in accordance with the
              laws of the jurisdiction in which Clinsight operates, without
              regard to its conflict of law provisions.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border-default px-6 py-4 bg-canvas flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-md hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
