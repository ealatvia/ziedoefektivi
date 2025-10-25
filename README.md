# Ziedo Efektīvi

"Back-end-less" website for collecting donations.

## How it works

We host our frontend Next.js code on Netlify. The code fetches content from our CMS, Strapi. It uses this content to build
and display a mostly static website, except a few API routes.

Main donation flow looks like this:
1. User fills out a form
2. User has the option to donate via bank transfer. If they choose this option, they do a POST request to a route we have to collect their form data and send it to Strapi as a database entry.
3. User has the option to donate via credit card. If they choose this option, they do a POST request to a route where we collect their form data, and then create a new Stripe checkout session.
  This checkout session contains the form data. We redirect the user to this checkout session.
4. User completes checkout. Stripe redirects them back to us, where we just show a success or fail page.
5. When stripe processes the payment, it calls a webhook. This webhook goes to a route where we retrieve the form data, and then send it to Strapi.

Relevant files:
1. components/elements/sections/DonationSection.js
2. WIP
3. app/api/create-checkout-session/route.js
4. app/donation/success/page.js & app/donation/cancel/page.js
5. app/api/webhooks/route.js

## Setup
### Backend
You will need a specific Node version to run stuff. To do that, install a node version manager, like fnm.
Also you will need a local postgres instance running. (Don't make it under the backend folder, it will cause refresh hell)
```bash
initdb -D local_postgres
```
Open local_postgres/postgresql.conf and change the socket location to one you don't need root for.
`unix_socket_directories = '/tmp' # comma-separated list of directories`
You can also set the port to avoid needing to specify it.
`port = 5432`

Now we can run postgres:
```bash
postgres -D local_postgres
```

And while postgres is running, we can create the database:
```bash
createdb annetatargalt -h /tmp
psql
create user annetatargalt with encrypted password 'TODO';
grant all privileges on database annetatargalt to annetatargalt;
ALTER DATABASE annetatargalt OWNER TO annetatargalt;
\q
```

Setup your backend/.env file using the example given.
Then run backend:
```bash
cd backend
yarn install
yarn develop
```

## Running locally (frontend)
Setup your frontend/.env file using the example; if you go to the Strapi dashboard on prod and create an API key you can actually fetch data
from it and don't need to run backend.
```bash
cd frontend
yarn install
yarn run develop
```

## Testing webhooks with Stripe locally
1. Install Stripe CLI. https://docs.stripe.com/stripe-cli/install?install-method=linux
2. `stripe login`
3. `stripe listen --forward-to localhost:3000/api/webhooks`
4. Get your webhook signing secret from the CLI output and add it to your .env:
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
5. `./checkout.sh`

# Adding content
Make sure you create the Global object in Strapi and fill out all the fields, otherwise stuff will break.
Pages with static content need to be created as a Page object in Strapi. Fill out the fields. And then add a section on that page to display stuff.
Pages with dynamic content (fetching a specific blog, for example) need to be made as a SpecialPage in Strapi. And the slug pattern should end with a forward slash I guess.

# Old README from the project we copied:
# Anneta Targalt

This is the code for the Anneta Targalt donation platform that runs at https://annetatargalt.ee/.


## Overview

External services (need accounts):
- [Strapi](https://strapi.io/pricing-cloud) SaaS - host BE
- [Netlify](https://www.netlify.com/) - host FE (Vercel is paid only for org repos)
- [Goatcounter](https://www.goatcounter.com) - for cookie-less tracking
- [Brevo](https://www.brevo.com/) (plugin in Strapi) - for emails
- [Montonio](https://montonio.com/) - for payments

Backend stack (see `/backend`):
- Javascript
- [Strapi 4](https://strapi.io/)

Frontend stack (see `/frontend`):
- Javascript
- [Next.js 13](https://nextjs.org/) & [React](https://react.dev/)
- [HeadlessUI](https://headlessui.com/)
- [TailwindCSS](https://tailwindcss.com/)


## Setup

### Getting started

1. Clone the repository and install dependencies:
    ```bash
    git clone https://github.com/eaeesti/annetatargalt.git
    cd annetatargalt
    yarn setup
    ```

2. Setup backend locally (see [`backend/README.md`](backend/README.md])) or create a cloud account (TBD).

3. Setup frontend locally, see [`frontend/README.md`](frontend/README.md])

4. Run frontend and backend separately from their folders, or at the same time from root folder:
    ```bash
    yarn develop
    ```




# Docs from Andri

It runs on Strapi for the backend and Next.js for the frontend. Strapi is essentially a FOSS headless CMS where you can write your website copy and let other volunteers change them as well. Next.js (a full-stack React framework) then pulls the data and pre-builds a super fast website with SSR and SSG. Strapi is also used to handle and store donations, since it can have custom routes, controllers and services.

The repository itself doesn't have any of the copy or site content. If you want to try to set it up locally, I can give you the Strapi seed data for our our website, so it's easier to translate. Some parts require a speciﬁc way to set up that I haven't documented yet.

We use Montonio for single payments: https://montonio.com/payments/. They're an Estonian company, but they also operate in Latvia and a bunch of other countries. They charge 0.05€ per each payment which is almost nothing, but they disabled the fee for us without us even asking, so we can direct 100% of donations to charities. I don't know if they do this for all NGO-s or just us. They didn't specify :D.

I'm not sure what banks are used in Latvia, but Montonio supports 09.01.25 21:13Swedbank, SEB, Luminor, Citadele and I think Revolut. If that's not enough, maybe you can write to them to support more banks or we can integrate another payment system that is more Latvia-friendly. If you do decide to go with Montonio, you will need to create an account
with your organization and get API keys.

For recurring donations, we direct users to a pre-ﬁlled recurring payment page for their bank and then we just receive bank transactions from them and add them to our database semi-manually.
It sounds silly, but all recurring donations in Estonia are handled this way I think. I was able to create pre-ﬁlled pages for Swedbank, LHV, SEB and Coop. We can be add new ones as well if they allow creating such links. You can ﬁnd the code for generating recurring payment links here: https://github.com/eaeesti/annetatargalt/blob/main/backend/src/utils/banks.js. There is also an "other bank" option that just gives donors the information to make the recurring payment manually. If organisations in Latvia use a more sensible way of doing recurring payments (like credit cards), we can integrate that as well. I just haven't done that because it hasn't been necessary for us.

Some other services we use:
- Plausible (another Estonian startup :P) for cookieless website tracking - It costs 6€/month for up to 10k requests per month, but I use less than half of them, so I can add you to my plan if you're okay with me having access to the data. I can give you full access to yours. This one is slightly diﬃcult to change because the project is currently built around Plausible. I can deﬁnitely add support for another one if you want to use GA or something. I'd just prefer the website to be privacy-friendly and to not use cookies.
- Brevo for transactional emails - Up to 300 emails per day in the free plan. Should be very easy to switch providers if you have other preferences like Sendgrid, since it's just a plug-and-play Strapi module.
- Cloudinary as a CDN - Free for quite a huge amount of bandwidth. I don't think I've exceeded 10% on any month so far. The cheapest plan is super expensive though, at which point I might choose a diﬀerent provider. Also very easy to switch providers.

For hosting, we use Vercel for the Next.js app and a DigitalOcean droplet for Strapi. Vercel is really easy to set up and it's free for a project of our size. The DigitalOcean droplet costs ~6€ per month and it is a bit trickier to set up, but I have a build script and a list of commands that need to be run to get it set up, which I can share with you. I can also help set it up for you of course.
I think you'll have to fork our repository and make some small changes, because it wasn't possible to make everything conﬁgurable. This includes small things like the HTML language property and the 09.01.25 21:13colour scheme in case you want to change it. I can't remember all of them right now, but we'll probably ﬁgure them out when we set the site up for you.
