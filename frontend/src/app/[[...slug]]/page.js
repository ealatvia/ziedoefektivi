import Section from "@/components/Section";
import { buildMetadata } from "../../utils/seo";
import { getGlobal, getPageBySlug, findSpecialPage } from "../../utils/strapi";

async function getSlug(params) {
  // Await the params object first
  const resolvedParams = await params;

  if (!resolvedParams.slug) return "/";
  if (resolvedParams.slug.length === 0) return "/";
  if (resolvedParams.slug.length === 1 && resolvedParams.slug[0] === "index") return "/";
  return resolvedParams.slug.join("/");
}

export async function generateMetadata({ params }) {
  const slug = await getSlug(params);
  const global = await getGlobal();
  const specialPage = await findSpecialPage(slug);

  if (specialPage) {
    return buildMetadata(global, specialPage.entity.metadata);
  }

  const page = await getPageBySlug(slug);
  return buildMetadata(global, page.metadata);
}

export default async function SlugPage({ params }) {
  const slug = await getSlug(params);
  const global = await getGlobal();

  const specialPage = await findSpecialPage(slug);
  if (specialPage) {
    return specialPage.page.sections.map((section) => (
      <Section
        key={section.id}
        section={section}
        page={specialPage.page}
        entity={specialPage.entity}
        global={global}
      />
    ))
  }

  const page = await getPageBySlug(slug);
  return page.sections.map((section) => (
    <Section
      key={section.id}
      section={section}
      global={global}
      page={page}
    />
  ))
}
