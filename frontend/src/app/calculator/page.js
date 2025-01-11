import Page from "../../components/Page";
import { buildMetadata } from "../../utils/seo";
import { getGlobal, getPageBySlug, findSpecialPage } from "../../utils/strapi";
import Calculator from "./Calculator";

// TODO non-page specific
// export async function generateMetadata({ params }) {
//   const slug = getSlug(params);
//   const global = await getGlobal();
//   const specialPage = await findSpecialPage(slug);

//   if (specialPage) {
//     return buildMetadata(global, specialPage.entity.metadata);
//   }

//   const page = await getPageBySlug(slug);

//   return buildMetadata(global, page.metadata);
// }

export default async function CalculatorPage() {
  const global = await getGlobal();

  return <Calculator global={global} />;
}
