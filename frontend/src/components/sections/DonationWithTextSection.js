"use client";

import Markdown from "../elements/Markdown";
import DonationSection from "./DonationSection";

export default function DonationWithTextSection({ text, ...props }) {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="flex justify-center px-4 py-24">
            {text ? (
              <Markdown className="prose prose-primary w-full max-w-4xl">
                {text}
              </Markdown>
            ) : null}
          </div>

          <div className="w-full">
            <DonationSection {...props} />
          </div>
        </div>
      </div>
    </section>
  );
}
