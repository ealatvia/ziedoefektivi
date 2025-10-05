import NextImage from "next/image";

export default function Image({
  data,
  className,
  fill = false,
  priority = false,
}) {
  const image = data.data?.attributes;
  
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${url}`;
  };

  if (!image) {
    return (
      <NextImage
        className={className}
        src="https://placehold.co/320x320.png"
        width={320}
        height={320}
      />
    );
  }

  if (fill) {
    return (
      <NextImage
        className={className}
        src={getImageUrl(image.url)}
        alt={image.alternativeText}
        fill={true}
        priority={priority}
      />
    );
  }

  return (
    <NextImage
      className={className}
      src={getImageUrl(image.url)}
      alt={image.alternativeText}
      width={image.width}
      height={image.height}
      priority={priority}
    />
  );
}
