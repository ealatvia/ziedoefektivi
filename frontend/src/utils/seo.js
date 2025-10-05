export function buildMetadata(global, pageMetadata) {
  const globalMetadata = global.metadata;

  if (!pageMetadata) return globalMetadata;

  let title = globalMetadata.title;
  if (pageMetadata.title) title = `${pageMetadata.title} • ${title}`;

  const icons = {};
  if (global.favicon16?.data?.attributes?.url && global.favicon32?.data?.attributes?.url) {
    icons.icon = [
      {
        url: global.favicon16.data.attributes.url,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: global.favicon32.data.attributes.url,
        sizes: "32x32",
        type: "image/png",
      },
    ];
  }
  if (global.appleTouchIcon?.data?.attributes?.url) {
    icons.apple = [
      {
        url: global.appleTouchIcon.data.attributes.url,
        sizes: "180x180",
        type: "image/png",
      },
    ];
  }

  const ogImage =
    pageMetadata.shareImage?.data?.attributes ||
    globalMetadata.shareImage?.data?.attributes;

  const openGraph = {};
  if (ogImage) {
    openGraph.images = [
      {
        url: ogImage.url,
        width: ogImage.width,
        height: ogImage.height,
        alt: ogImage.alternativeText,
      },
    ];
  }

  const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    title,
    description: pageMetadata.description || globalMetadata.description,
    openGraph,
    icons,
  };

  return metadata;
}
