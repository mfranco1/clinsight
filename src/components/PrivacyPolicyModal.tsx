import BrandName from "./brand/BrandName";
import React from "react";
import { Icons } from "./ui/Icons";
interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
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
            Privacy Policy
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
          <div className="bg-canvas p-4 rounded-lg border border-border-default text-xs text-content-secondary">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString()}{" "}
            <br />
            This Privacy Policy explains how <BrandName /> ("we", "us", or
            "our") collects, uses, and discloses information about you when you
            use our clinical documentation automation platform.
          </div>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              1. Introduction & Scope
            </h3>
            <p>
              <BrandName /> is a professional medical utility designed to assist
              healthcare providers in generating clinical documentation. We
              recognize the sensitivity of the data processed through our
              Application, specifically Protected Health Information (PHI). We
              are committed to protecting patient privacy and ensuring
              compliance with applicable laws, including the Health Insurance
              Portability and Accountability Act (HIPAA).
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              2. Data Collection
            </h3>
            <p className="mb-2">
              We collect and process the following types of information:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Input Data:</strong> Text, audio recordings, and
                documents (PDF, Images) provided by the user for the purpose of
                generating medical charts.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact
                with our Application (e.g., timestamps, feature usage) for
                performance monitoring.
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating
                system, and IP address for security auditing.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              3. Use of Artificial Intelligence
            </h3>
            <p>
              Our Service utilizes advanced Large Language Models (LLMs),
              specifically Google Gemini, to process input data.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                <strong>Data Transmission:</strong> Clinical data is transmitted
                securely via encryption (TLS 1.2+) to the AI provider for
                processing.
              </li>
              <li>
                <strong>No Training on Data:</strong> Data submitted through the
                Enterprise/Professional tier of this API is NOT used to train
                the underlying AI models.
              </li>
              <li>
                <strong>Transient Processing:</strong> Input data is processed
                for the sole purpose of generating the response and is not
                persistently stored by the AI provider after generation.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              4. Data Security
            </h3>
            <p>
              We implement industry-standard security measures designed to
              protect your data from unauthorized access, disclosure,
              alteration, and destruction. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>End-to-end encryption for data in transit.</li>
              <li>Strict access controls and authentication mechanisms.</li>
              <li>
                Ephemeral data handling: Clinical data processed in the browser
                is cleared upon session reset and is not stored on <BrandName />
                servers permanently.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              5. Provider Responsibility
            </h3>
            <p>
              <strong>Important:</strong> <BrandName /> is a clinical decision
              support tool. The healthcare provider remains solely responsible
              for verifying the accuracy of all generated documentation (SOAP
              notes, Patient Summaries) and for the final patient care
              decisions. The user acknowledges that AI-generated content may
              contain errors ("hallucinations") and must be reviewed clinically.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-content-strong mb-2">
              6. Contact Us
            </h3>
            <p>
              If you have any questions about this Privacy Policy or our data
              practices, please contact our Data Protection Officer at:
            </p>
            <p className="mt-2 font-medium text-neutral-800">
              compliance@clinsight-health.com
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-border-default px-6 py-4 bg-canvas flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-md hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
