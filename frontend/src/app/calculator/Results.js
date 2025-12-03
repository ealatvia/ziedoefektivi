import { useState } from "react";
import {
  dailyToMonthly,
  getIncomePercentile,
  getIncome,
  internationalizeIncome,
} from "./utils/calculator";
import CallToAction from "./CallToAction";
import HorizontalRule from "./HorizontalRule";
import ResultBarChart from "./ResultBarChart";
import ResultPieChart from "./ResultPieChart";
import SliderInput from "./SliderInput";
import Impact from "./Impact";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import { formatNumber, round, roundMoney } from "./utils/numbers";
import ShareButtons from "./ShareButtons";
import Footer from "./Footer";

function calculate(income) {
  const percentile = getIncomePercentile(income).toFixed(1);
  const topPercentile = (100 - percentile).toFixed(1);
  const medianIncome = dailyToMonthly(getIncome(50));
  const internationalizedIncome = internationalizeIncome(income);

  const timesRicherThanMedian = internationalizedIncome / medianIncome;

  return {
    percentile,
    topPercentile,
    medianIncome,
    internationalizedIncome,
    timesRicherThanMedian,
  };
}

export default function Results({ income, evaluations }) {
  // https://www.err.ee/1609187365/alampalk-touseb-2024-aastal-820-euroni
  const minimumIncome = 820;
  const taxFreeMinimum = 654;
  const retirementFund = 0.02 * minimumIncome;
  const unemploymentInsurance = 0.016 * minimumIncome;
  const incomeTax =
    (minimumIncome - retirementFund - unemploymentInsurance - taxFreeMinimum) *
    0.2;
  const netMinimumIncome =
    minimumIncome - retirementFund - unemploymentInsurance - incomeTax;

  let defaultDonationPercentage = 1;
  if (income > netMinimumIncome * 2) {
    defaultDonationPercentage = 10;
  } else if (income > netMinimumIncome * 1.5) {
    defaultDonationPercentage = 5;
  }

  const [donationPercentage, setDonationPercentage] = useState(
    defaultDonationPercentage
  );

  const {
    percentile,
    topPercentile,
    medianIncome,
    internationalizedIncome,
    timesRicherThanMedian,
  } = calculate(income);

  const incomeAfterDonating = income * (1 - donationPercentage / 100);
  const afterDonating = calculate(incomeAfterDonating);

  const yearlyDonation = round(12 * (income - incomeAfterDonating), 2);

  return (
    <div
      id="tulemused"
      className="flex flex-col items-center space-y-12 max-w-xl md:space-y-16 animate-fade-in"
    >
      <HorizontalRule />
      <h2 className="text-2xl text-center">
        Tu esi starp{" "}
        <span className="font-bold tracking-tight text-primary-700">
          {topPercentile <= 1 && "<"}
          {topPercentile >= 99 && ">"}
          {formatNumber(topPercentile)}%
        </span>{" "}
        bagātāko pasaules iedzīvotāju!
      </h2>
      <div className="w-64 h-64 md:h-96 md:w-96">
        <ResultPieChart percentile={percentile} topPercentile={topPercentile} />
      </div>
      <div className="text-xl text-center">
      Tu esi bagātāks par{" "}
        <span className="font-bold tracking-tight text-primary-700">
          {percentile >= 99 && ">"}
          {percentile <= 1 && "<"}
          {formatNumber(percentile)}%
        </span>{" "}
        cilvēces.
      </div>
      {timesRicherThanMedian >= 2 && (
        <>
          <HorizontalRule />
          <h2 className="text-xl text-center">
          Tavi ienākumi ir{" "}
            <span className="font-bold tracking-tight text-primary-700">
              {formatNumber(round(timesRicherThanMedian, 1))} reizes lielāki
            </span>{" "}
            par pasaules <span class="info-term" tabindex="0" aria-describedby="tip1">mediānu<span id="tip1" role="tooltip" class="tooltip">Vērtība, virs kuras atrodas 50% no cilvēku ienākumiem</span></span>.
          </h2>
          <div className="flex flex-col space-y-8">
            <div className="w-80 h-64 sm:w-96 sm:h-80 md:h-96 md:w-144">
              <ResultBarChart
                medianIncome={medianIncome}
                internationalizedIncome={internationalizedIncome}
              />
            </div>
            <div className="text-xs text-center md:text-sm">
            Ienākumi, kas konvertēti{" "}
              <a
                className="font-semibold text-primary-700 hover:opacity-70"
                href="https://en.wikipedia.org/wiki/International_dollar"
                target="_blank"
                rel="noopener noreferrer"
              >
                starptautiskajos dolāros
                <ArrowTopRightOnSquareIcon className="inline mb-0.5 ml-1 w-4 h-4" />
              </a>
              .
            </div>
          </div>
          {income > netMinimumIncome && (
            <>
              <HorizontalRule />
              <h2 className="text-xl text-center">
                Ja Tu ziedotu{" "}
                <span className="font-bold tracking-tight text-primary-700">
                  {donationPercentage}%
                </span>{" "}
                no saviem ienākumiem...
              </h2>
              <SliderInput
                percentage={donationPercentage}
                setPercentage={setDonationPercentage}
                min={1}
                max={50}
              />
              <HorizontalRule />
              <h2 className="text-xl text-center">
                ... Tu joprojām būtu starp{" "}
                <span className="font-bold tracking-tight text-primary-700">
                  {formatNumber(afterDonating.topPercentile)}%
                </span>{" "}
                turīgāko iedzīvotāju pasaulē ...
              </h2>
              <div className="w-64 h-64 md:h-96 md:w-96">
                <ResultPieChart
                  percentile={afterDonating.percentile}
                  topPercentile={afterDonating.topPercentile}
                  animated={false}
                />
              </div>
              <HorizontalRule />
              <h2 className="text-xl text-center">
                Katru gadu Tavs{" "}
                <span className="font-bold tracking-tight text-primary-700">
                  {formatNumber(roundMoney(yearlyDonation))} €
                </span>{" "}
                ziedojums varētu palīdzēt...
              </h2>
              <Impact evaluations={evaluations} donation={yearlyDonation} />
              <div className="text-xl text-center">
                ... ja Tu ziedotu pasaules efektīvākajām labdarības organizācijām.
              </div>
            </>
          )}
        </>
      )}
      <HorizontalRule />
      <CallToAction />
      <HorizontalRule />
      <ShareButtons />
      <HorizontalRule />
      <Footer />
    </div>
  );
}
