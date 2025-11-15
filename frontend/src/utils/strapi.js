import qs from "qs";
import { notFound } from "next/navigation";

export function getStrapiURL(path = "") {
  return `${
    process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://127.0.0.1:1337"
  }${path}`;
}

export async function fetchAPI(path, urlParamsObject = {}, options = {}) {
  try {
    const token = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

    // Merge default and user options
    const mergedOptions = {
      method: options.body ? "POST" : "GET",
      ...options,
      next: {
        revalidate: 60,
        ...options.next,
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    };

    // Build request URL
    const queryString = qs.stringify(urlParamsObject);
    const requestUrl = `${getStrapiURL(
      `/api${path}${queryString ? `?${queryString}` : ""}`,
    )}`;

    // Trigger API call
    if(!requestUrl.includes('populate=deep')) console.log(requestUrl, mergedOptions)
    const response = await fetch(requestUrl, mergedOptions);
    const data = await response.json();
    if(!requestUrl.includes('populate=deep')) console.log(response, data)
    return data;
  } catch (error) {
    console.error(error);
    throw new Error(
      "Please check if your server is running and you set all the required tokens.",
    );
  }
}

export async function getPageBySlug(slug) {
  const path = "/pages";
  const urlParamsObject = {
    filters: { slug },
    populate: "deep",
  };

  const response = await fetchAPI(path, urlParamsObject);

  try {
    return response.data[0].attributes;
  } catch (error) {
    notFound();
  }
}

export async function getGlobal() {
  const path = "/global";
  const urlParamsObject = { populate: "deep" };

  const response = await fetchAPI(path, urlParamsObject);

  if (response == null || response.data == null) {
    console.error("Missing data.attributes from response: " + JSON.stringify(response));
    return null;
  }
  return response.data.attributes;
}

export async function getSpecialPages() {
  const path = "/special-pages";
  const urlParamsObject = { populate: "deep,3" };

  const response = await fetchAPI(path, urlParamsObject);

  const specialPages = response.data.map(({ attributes }) => attributes);

  return specialPages;
}

export async function findSpecialPage(slug) {
  const specialPages = await getSpecialPages();

  const foundSpecialPage = specialPages.find((specialPage) => {
    const slugMatcher = new RegExp(specialPage.slugPattern);
    return slugMatcher.test(slug);
  });

  if (!foundSpecialPage) return null;

  const slugMatcher = new RegExp(foundSpecialPage.slugPattern);
  const endpoint = slug.match(slugMatcher)[1];

  const entity = await getEntityBySlug(
    foundSpecialPage.collectionType,
    endpoint,
  );

  return { page: foundSpecialPage, entity };
}

export async function getEntityBySlug(type, slug) {
  const path = `/${type}`;
  const urlParamsObject = {
    filters: { slug },
    populate: "deep,3",
  };

  const response = await fetchAPI(path, urlParamsObject);
  const { attributes, id } = response.data[0];

  try {
    return { ...attributes, id };
  } catch (error) {
    notFound();
  }
}

export async function getAllSlugs() {
  const pagesPath = "/pages";
  const urlParamsObject = { populate: "deep,2" };

  const pagesResponse = await fetchAPI(pagesPath, urlParamsObject);
  const pageSlugs = pagesResponse.data.map(({ attributes }) => attributes.slug);

  const causesPath = "/causes";
  const causesResponse = await fetchAPI(causesPath, urlParamsObject);
  const causes = causesResponse.data.map(({ attributes }) => attributes);
  const causeSlugs = causes.map((cause) => cause.slug);

  const organizationSlugs = causes
    .map((cause) =>
      cause.organizations.data.map(
        (organization) => `${cause.slug}/${organization.attributes.slug}`,
      ),
    )
    .flat();

  const blogPosts = await getBlogPosts();
  const global = await getGlobal();
  const blogPostSlugs = blogPosts.map(
    (blogPost) => `${global.blogSlug}/${blogPost.slug}`,
  );

  const allSlugs = [
    ...pageSlugs,
    ...causeSlugs,
    ...organizationSlugs,
    ...blogPostSlugs,
  ];

  return allSlugs;
}

export async function getBlogPosts() {
  const path = "/blog-posts";
  const urlParamsObject = { populate: "deep,2", sort: "date:desc" };

  const response = await fetchAPI(path, urlParamsObject);

  const blogPosts = response.data.map(({ attributes }) => attributes);

  return blogPosts;
}

export function strapiSectionNameToReactComponentName(component) {
  return snakeCaseToPascalCase(component.split(".")[1]);
}

export function snakeCaseToPascalCase(string) {
  return string
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

export async function getOrganizations() {
  const path = "/organizations";
  const urlParamsObject = {
    populate: "deep,2",
    sort: "title:asc",
    filters: {
      cause: {
        id: {
          $notNull: true,
        },
      },
    },
  };

  const response = await fetchAPI(path, urlParamsObject);

  const organizations = response.data.map(({ id, attributes }) => {
    return { ...attributes, id };
  });

  return organizations;
}

/**
 * @param {{amount: number,type: 'onetime' | 'recurring',firstName: string,lastName: string,email: string,idCode: string,amounts: { organizationId: number, amount: number }[],paymentMethod: 'paymentInitiation'|'cardPayments',stripePaymentIntentId?: string, stripeSubscriptionId?: string}} donation
 */
export function makeDonationRequest(donation) {
  return fetchAPI("/donate", {}, {
    body: JSON.stringify(donation),
  });
}

/**
 * @param {Pick<import("stripe").Stripe.Invoice, 'subscription'|'payment_intent'|'created'|'amount_paid'>} recurringDonation
 */
export function makeStripeRecurringDonationRequest({ subscription, payment_intent, created, amount_paid }) {
  return fetchAPI("/donateStripeRecurring", {}, {
    body: JSON.stringify({ subscription, payment_intent, created, amount_paid }),
  });
}

/**
 * @param {Pick<import("stripe").Stripe.Dispute, 'id'|'created'|'payment_intent'} disputeFundsWithdrawnEvent
 */
export function makeDisputeRequest({id, created, payment_intent}) {
  return fetchAPI("/donations/disputeDonation", {}, {
    body: JSON.stringify({ id, created, payment_intent }),
  });
}
