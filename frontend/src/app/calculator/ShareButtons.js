import {
  FacebookShareButton,
  LinkedInShareButton,
  TwitterShareButton,
} from "./buttons";

export default function ShareButtons() {
  const url = "https://ziedoefektivi.lv/calculator";

  return (
    <div className="flex flex-col items-center space-y-8 w-full text-center">
      <h2 className="text-xl">Kopīgojiet šo lapu:</h2>
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4">
        <FacebookShareButton buttonText="Facebook" url={url} />
        <TwitterShareButton
          buttonText="Twitter"
          tweet="Kādi ir Tavi ienākumi salīdzinājumā ar pārējo pasauli?"
          hashtags={["ziedoefektivi", "kalkulators"]}
          url={url}
        />
        <LinkedInShareButton buttonText="LinkedIn" url={url} />
      </div>
    </div>
  );
}
