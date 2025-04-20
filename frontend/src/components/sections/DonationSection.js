"use client";

import { useState } from "react";
import { at, pick } from "@/utils/object";
import AmountChooser from "../elements/forms/AmountChooser";
import DonationTypeChooser from "../elements/forms/DonationTypeChooser";
import Button from "../elements/Button";
import Steps from "../elements/forms/Steps";
import NameInput from "../elements/forms/NameInput";
import EmailInput from "../elements/forms/EmailInput";
import IdCodeInput from "../elements/forms/IdCodeInput";
import { formatAmount } from "@/utils/local";
import CheckboxInput from "../elements/forms/CheckboxInput";
import { useRouter, useSearchParams } from "next/navigation";
import Markdown from "../elements/Markdown";
import { format } from "@/utils/string";
import OrganizationChooser from "../elements/forms/OrganizationChooser";
import Proportions from "@/utils/proportions";
import PaymentSummary from "../elements/forms/PaymentSummary";
import Modal from "../Modal";
import CompanyInput from "../elements/forms/CompanyInput";
import DedicationInput from "../elements/forms/DedicationInput";
import { GCEvent } from "next-goatcounter";
import { amountsFromProportions } from "@/utils/donation";

const initiateStripeCheckout = async (donationData) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });

    const session = await response.json();

    if (session.url) {
      window.location.href = session.url;
    } else {
      throw new Error('Failed to create checkout session');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export default function DonationSection(props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({});

  function showModal(data) {
    setModalData(data);
    setModalOpen(true);
  }

  const amounts = at(props, ["amount1", "amount2", "amount3"]);
  const amountOptions = amounts.map((amount) => ({
    value: amount,
    label: `${amount}${props.global.currency}`,
  }));
  const typeParam = searchParams.get("type");
  const orgParam = Number(searchParams.get("org"));

  const [donation, setDonation] = useState({
    amount: amountOptions[1].value,
    type: typeParam === "recurring" ? "recurring" : "onetime",
    id: "",
    firstName: "",
    lastName: "",
    email: "",
    idCode: "",
    companyDonation: false,
    companyName: "",
    companyCode: "",
    dedicateDonation: false,
    dedicationName: "",
    dedicationEmail: "",
    dedicationMessage: "",
    proportions: Proportions.fromStrapiData(props.causes.data, orgParam),
    addTip: false,
    acceptTerms: false,
  });

  const buildDonationId = () => {
    // Start with prefix
    let donationId = "ziedojums-";
    
    // Add proportion percentages for each cause in order
    donation.proportions.keys().forEach(key => {
      const proportion = donation.proportions.getProportion(key);
      
      // Convert proportion to characters: 00 for 0%, 99 for 99%, C for 100%
      let proportionCode;
      if (proportion < 10) {
        proportionCode = "0" + proportion.toString();
      } else if (proportion === 100) {
        proportionCode = "C";
      } else {
        proportionCode = proportion.toString();
      }
      
      donationId += proportionCode;
    });
    
    // Add 't' suffix if the user opted to add a tip
    if (donation.addTip) {
      donationId += "t";
    }
    
    return donationId;
  }

  const [validity, setValidity] = useState({});
  const stageValidity = {
    0: at(validity, ["amount"]).every(Boolean),
    1: at(validity, [
      "firstName",
      "lastName",
      "email",
      "idCode",
      "company",
      "dedication",
    ]).every(Boolean),
    2: donation.acceptTerms,
    3: donation.acceptTerms,
  };

  const [stage, setStage] = useState(0);
  const [donated, setDonated] = useState(false);

  const tipAmount = donation.addTip
      ? Math.round(0.05 * donation.amount * 100) / 100
      : 0;
  const totalAmount = Math.round((donation.amount + tipAmount) * 100) / 100;

  // Generate the donation ID and set it in state when entering stage 3
  const updateDonationId = () => {
    const donationId = buildDonationId();
    setDonation(prevDonation => ({ ...prevDonation, id: donationId }));
    return donationId;
  }
  
  const donateWithBank = async () => {
    // Use donation ID from state or generate a new one
    const donationId = donation.id || updateDonationId();
    
    // Build organization info map with cause titles and exact amounts
    const organizationInfo = {};
    
    // Get exact amounts per organization using the same function as PaymentSummary
    const organizationAmounts = amountsFromProportions({
      proportions: donation.proportions,
      causes: props.causes,
      totalAmount: donation.amount,
    });
    
    // Create entries for each cause with its amount - in the same order as donation.proportions.keys()
    const orderedCauses = [];
    donation.proportions.keys().forEach(causeId => {
      const causeProportion = donation.proportions.getProportion(causeId);
      if (causeProportion > 0) {
        const cause = props.causes.data.find(c => c.id === causeId);
        if (cause) {
          orderedCauses.push({ id: causeId, cause });
        }
      }
    });
    
    // Map the ordered causes to organizationInfo
    orderedCauses.forEach(({ id: causeId, cause }) => {
      // Sum up amounts for all organizations in this cause
      let causeAmount = 0;
      cause.attributes.organizations.data.forEach(org => {
        if (organizationAmounts[org.id]) {
          causeAmount += organizationAmounts[org.id];
        }
      });
      
      // Round to 2 decimal places
      causeAmount = Math.round(causeAmount * 100) / 100;
      
      // Add to organizationInfo
      organizationInfo[causeId] = {
        name: cause.attributes.title,
        amount: causeAmount,
        percentage: donation.proportions.getProportion(causeId),
        order: orderedCauses.findIndex(item => item.id === causeId) // Add order for sorting
      };
    });
    
    // Add tip as another entry if it exists
    if (donation.addTip && tipAmount > 0) {
      organizationInfo['tip'] = {
        name: props.global.tipOrganization,
        amount: tipAmount,
        percentage: 0,
        order: Object.keys(organizationInfo).length // Place at the end
      };
    }
    
    const donationData = {
      ...donation,
      id: donationId,
      organizationInfo: JSON.stringify(organizationInfo),
      tipAmount: tipAmount,
      tipOrganization: props.global.tipOrganization
    };
    
    const response = await fetch('/api/register-bank-donation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });
  }

  const donateWithCard = async () => {
    // Use donation ID from state or generate a new one
    const donationId = donation.id || updateDonationId();
    
    // Build organization info map with cause titles and exact amounts
    const organizationInfo = {};
    
    // Get exact amounts per organization using the same function as PaymentSummary
    const organizationAmounts = amountsFromProportions({
      proportions: donation.proportions,
      causes: props.causes,
      totalAmount: donation.amount,
    });
    
    // Create entries for each cause with its amount - in the same order as donation.proportions.keys()
    const orderedCauses = [];
    donation.proportions.keys().forEach(causeId => {
      const causeProportion = donation.proportions.getProportion(causeId);
      if (causeProportion > 0) {
        const cause = props.causes.data.find(c => c.id === causeId);
        if (cause) {
          orderedCauses.push({ id: causeId, cause });
        }
      }
    });
    
    // Map the ordered causes to organizationInfo
    orderedCauses.forEach(({ id: causeId, cause }) => {
      // Sum up amounts for all organizations in this cause
      let causeAmount = 0;
      cause.attributes.organizations.data.forEach(org => {
        if (organizationAmounts[org.id]) {
          causeAmount += organizationAmounts[org.id];
        }
      });
      
      // Round to 2 decimal places
      causeAmount = Math.round(causeAmount * 100) / 100;
      
      // Add to organizationInfo
      organizationInfo[causeId] = {
        name: cause.attributes.title,
        amount: causeAmount,
        percentage: donation.proportions.getProportion(causeId),
        order: orderedCauses.findIndex(item => item.id === causeId) // Add order for sorting
      };
    });
    
    // Add tip as another entry if it exists
    if (donation.addTip && tipAmount > 0) {
      organizationInfo['tip'] = {
        name: props.global.tipOrganization,
        amount: tipAmount,
        percentage: 0,
        order: Object.keys(organizationInfo).length // Place at the end
      };
    }
    
    const donationData = {
      ...pick(donation, [
        "amount",
        "type",
        "firstName",
        "lastName",
        "email",
        "idCode",
        "proportions",
      ]),
      tipAmount: tipAmount,
      tipOrganization: props.global.tipOrganization,
      totalAmount,
      currency: props.global.currency.toLowerCase(),
      successUrl: `${window.location.origin}/donation/success`,
      cancelUrl: `${window.location.origin}/donation/cancel`,
      id: donationId,
      organizationInfo: JSON.stringify(organizationInfo),
    };

    if (donation.companyDonation) {
      donationData.companyName = donation.companyName;
      donationData.companyCode = donation.companyCode;
    }
    if (donation.dedicateDonation && donation.type === "onetime") {
      donationData.dedicationName = donation.dedicationName;
      donationData.dedicationEmail = donation.dedicationEmail;
      donationData.dedicationMessage = donation.dedicationMessage;
    }

    try {
      await initiateStripeCheckout(donationData);
    } catch (error) {
      showModal({
        icon: "error",
        title: props.global.errorText,
        description: error.message,
      });
    }
  };

  const summaryText =
    donation.type === "recurring"
      ? props.recurringDonationSummary
      : props.oneTimeDonationSummary;

  // Get recipient and IBAN from donationInfo if available
  const recipient = props.donationInfo?.recipient || "Missing recipient";
  const iban = props.donationInfo?.iban || "Missing IBAN";

  return (
      <section className="flex h-full flex-grow items-start justify-center bg-slate-200 xs:px-4 xs:py-16 sm:px-8 sm:py-32">
        <h1 className="sr-only">{props.page.metadata.title}</h1>
        {!donated && (
            <div className="flex w-full max-w-lg flex-col gap-4 bg-white px-4 py-24 xs:rounded-2xl xs:px-12 xs:py-12">
              <Steps
                  currentStep={stage}
                  setStep={setStage}
                  stepText={props.stepText}
                  stepCount={4}
                  backWord={props.global.backWord}
              />
              {stage === 0 && (
                  <form
                      className="flex flex-col gap-4"
                      onSubmit={(event) => event.preventDefault()}
                  >
                    <h2 className="text-2xl font-bold tracking-tight text-primary-700 sm:text-3xl">
                      {props.title}
                    </h2>
                    <DonationTypeChooser
                        donationType={donation.type}
                        setDonationType={(type) => setDonation({ ...donation, type })}
                        label={props.donationTypeText}
                        recurringDonationText={props.recurringDonationText}
                        singleDonationText={props.singleDonationText}
                    />
                    <AmountChooser
                        amount={donation.amount}
                        setAmount={(amount) => setDonation({ ...donation, amount })}
                        amountText={props.amountText}
                        amountOptions={amountOptions}
                        otherAmountText={props.otherAmountText}
                        otherAmountOptionText={props.otherAmountOptionText}
                        currency={props.global.currency}
                        setValidity={setValidity}
                    />
                    <OrganizationChooser
                        chooseOrganizationsText={props.chooseOrganizationsText}
                        informationText={props.informationText}
                        lockText={props.lockText}
                        letExpertsChooseText={props.letExpertsChooseText}
                        causes={props.causes}
                        proportions={donation.proportions}
                        setProportions={(proportions) =>
                            setDonation({ ...donation, proportions })
                        }
                    />
                    <Button
                        text={props.nextButtonText}
                        type="primary"
                        size="md"
                        onClick={() => {
                          GCEvent("donation-info-stage");
                          setStage(1);
                        }}
                        disabled={!stageValidity[0]}
                        buttonType="submit"
                        className="mt-4"
                    />
                  </form>
              )}
              {stage === 1 && (
                  <form
                      className="flex flex-col gap-4"
                      onSubmit={(event) => event.preventDefault()}
                  >
                    <h2 className="text-2xl font-bold tracking-tight text-primary-700 sm:text-3xl">
                      {props.detailsText}
                    </h2>
                    <NameInput
                        firstNameText={props.firstNameText}
                        lastNameText={props.lastNameText}
                        firstName={donation.firstName}
                        lastName={donation.lastName}
                        setFirstName={(firstName) =>
                            setDonation({ ...donation, firstName })
                        }
                        setLastName={(lastName) =>
                            setDonation({ ...donation, lastName })
                        }
                        setValidity={setValidity}
                    />
                    <EmailInput
                        emailText={props.emailText}
                        email={donation.email}
                        setEmail={(email) => setDonation({ ...donation, email })}
                        setValidity={setValidity}
                    />
                    <IdCodeInput
                        idCodeText={props.idCodeText}
                        idCodeDescription={props.idCodeDescription}
                        idCode={donation.idCode}
                        setIdCode={(idCode) => setDonation({ ...donation, idCode })}
                        setValidity={setValidity}
                    />
                    <CompanyInput
                        donateAsCompanyText={props.donateAsCompanyText}
                        companyDonation={donation.companyDonation}
                        setCompanyDonation={(companyDonation) =>
                            setDonation({ ...donation, companyDonation })
                        }
                        companyNameText={props.companyNameText}
                        companyName={donation.companyName}
                        setCompanyName={(companyName) =>
                            setDonation({ ...donation, companyName })
                        }
                        companyCodeText={props.companyCodeText}
                        companyCode={donation.companyCode}
                        setCompanyCode={(companyCode) =>
                            setDonation({ ...donation, companyCode })
                        }
                        setValidity={setValidity}
                    />
                    {donation.type === "onetime" && (
                        <DedicationInput
                            dedicateDonationText={props.dedicateDonationText}
                            dedicateDonation={donation.dedicateDonation}
                            setDedicateDonation={(dedicateDonation) =>
                                setDonation({ ...donation, dedicateDonation })
                            }
                            dedicationNameText={props.dedicationNameText}
                            dedicationName={donation.dedicationName}
                            setDedicationName={(dedicationName) =>
                                setDonation({ ...donation, dedicationName })
                            }
                            dedicationEmailText={props.dedicationEmailText}
                            dedicationEmail={donation.dedicationEmail}
                            setDedicationEmail={(dedicationEmail) =>
                                setDonation({ ...donation, dedicationEmail })
                            }
                            dedicationMessageText={props.dedicationMessageText}
                            dedicationMessage={donation.dedicationMessage}
                            setDedicationMessage={(dedicationMessage) =>
                                setDonation({ ...donation, dedicationMessage })
                            }
                            setValidity={setValidity}
                        />
                    )}
                    <Button
                        text={props.nextButtonText}
                        type="primary"
                        size="lg"
                        onClick={() => {
                          GCEvent("donation-support-stage");
                          setStage(2);
                        }}
                        disabled={!stageValidity[1]}
                        buttonType="submit"
                        className="mt-4"
                    />
                  </form>
              )}
              {stage === 2 && (
                  <form
                      className="flex flex-col gap-6"
                      onSubmit={(event) => event.preventDefault()}
                  >
                    <h2 className="text-2xl font-bold tracking-tight text-primary-700 sm:text-3xl">
                      {props.tipTitle}
                    </h2>
                    <Markdown className="prose prose-primary w-full">
                      {props.tipText}
                    </Markdown>
                    <CheckboxInput
                        name="tip"
                        label={props.tipCheckboxText}
                        value={donation.addTip}
                        setValue={(addTip) => setDonation({ ...donation, addTip })}
                    />
                    <Button
                        text={props.nextButtonText}
                        type="primary"
                        size="lg"
                        onClick={() => {
                          GCEvent("donation-summary-stage");
                          updateDonationId(); // Generate and set the donation ID
                          setStage(3);
                        }}
                        buttonType="submit"
                        className=""
                    />
                  </form>
              )}
              {stage === 3 && (
                  <form
                      className="flex flex-col gap-6"
                      onSubmit={(event) => event.preventDefault()}
                  >
                    <h2 className="text-2xl font-bold tracking-tight text-primary-700 sm:text-3xl">
                      {props.confirmText}
                    </h2>
                    <Markdown className="prose prose-primary w-full [&>p>strong]:text-primary-700">
                      {summaryText}
                    </Markdown>
                    <PaymentSummary
                        donation={donation}
                        causes={props.causes}
                        currency={props.global.currency}
                        totalText={props.global.totalText}
                        tipOrganization={props.global.tipOrganization}
                        tipAmount={tipAmount}
                        totalAmount={totalAmount}
                    />
                    <CheckboxInput
                        name="terms"
                        label={props.termsText}
                        value={donation.acceptTerms}
                        setValue={(acceptTerms) =>
                            setDonation({ ...donation, acceptTerms })
                        }
                    />
                    <Button
                        text="Ziedot ar karti"
                        type="primary"
                        size="lg"
                        onClick={() => {
                          GCEvent("donation-clicked");
                          donateWithCard();
                        }}
                        disabled={!stageValidity[3]}
                        buttonType="submit"
                        className="mt-4"
                    />
                    <Button
                        text="Ziedot ar bankas pārskaitījumu"
                        type="primary"
                        size="lg"
                        onClick={() => {
                          GCEvent("donation-clicked");
                          setStage(4);
                          donateWithBank();
                        }}
                        disabled={!stageValidity[3]}
                        buttonType="submit"
                        className="mt-4"
                    />
                  </form>
              )}
              {stage === 4 && (
                  <div>
                    <p>Jūsu ziedojums ir veiksmīgi reģistrēts. Lūdzu, veiciet pārskaitījumu.</p>
                    <p> Adresāts: <strong>{props.donationInfo?.recipient}</strong></p>
                    <p> IBAN: <strong>{props.donationInfo?.iban}</strong></p>
                    <p> Pārskaitījuma mērķis: <strong>{donation.id}</strong></p>
                    <p> Summa: <strong>{totalAmount.toFixed(2)} EUR</strong></p>
                  </div>
              )}
            </div>
        )}
        {donated && (
            <div className="flex max-w-lg flex-col gap-4 bg-white px-4 py-24 xs:rounded-2xl xs:px-12 xs:py-12 ">
              <Markdown className="prose prose-primary w-full">
                {format(props.recurringDonationGuide, {
                  amount: formatAmount(totalAmount) + props.global.currency,
                })}
              </Markdown>
            </div>
        )}
        <Modal
            open={modalOpen}
            data={modalData}
            setOpen={setModalOpen}
            closeText={props.global.closeText}
        />
      </section>
  );
}
