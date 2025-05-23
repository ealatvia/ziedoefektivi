import { outputsPerDonation } from "./utils/impact";
import { formatNumber, round } from "./utils/numbers";
import { ChildrenIcon, MedicineIcon, MosquitoNetIcon } from "./icons";

const charities = [
  {
    name: "AMF",
    beforeText: "izdalīt",
    afterText:
      "ar insekticīdiem apstrādātu gultas tīklus ģimenēm, kas dzīvo malārijas rajonos",
    icon: MosquitoNetIcon,
  },
  {
    name: "HKI",
    beforeText: "nodrošināt",
    afterText: "A vitamīna piedevas bērniem ar nepietiekamu uzturu",
    icon: MedicineIcon,
  },
  {
    name: "NI",
    beforeText: "vakcinēt",
    afterText: "bērnus pret vairākām slimībām",
    icon: ChildrenIcon,
  },
];

export default function Impact({ evaluations, donation }) {
  return (
    <div className="flex flex-col space-y-8 w-full md:space-y-12">
      {charities.map(({ name, beforeText, afterText, icon: Icon }, i) => (
        <div
          className={"flex flex-row items-center space-x-8 w-full text-lg"}
          key={`impact${i}`}
        >
          <div>
            <Icon className="w-24 h-24 text-primary-700" />
          </div>
          <div>
            {beforeText}{" "}
            <span className="font-bold tracking-tight text-primary-700">
              {formatNumber(
                round(outputsPerDonation(evaluations, name, donation))
              )}
            </span>{" "}
            {afterText}
          </div>
        </div>
      ))}
    </div>
  );
}
