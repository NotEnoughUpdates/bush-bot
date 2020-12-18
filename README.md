# mb-bot-ts
[![CodeFactor](https://www.codefactor.io/repository/github/notenoughupdates/mb-bot-ts/badge?s=708ab26519121898fd964e54b6ba3afdad396ac3)](https://www.codefactor.io/repository/github/notenoughupdates/mb-bot-ts)

## About

Bot for Moulberry's Bush discord server.

## How to set up

### Requirements
* Node version >=14.15.1 <15.0.0
* Packages installed with `yarn`
* Yarn
* Any os (probably)

### Steps

Clone the repository with any method. Then run `yarn`. You then need to create a folder called `config` in the src folder in that folder make 2 files 1 called `credentials.ts` and `botoptions.ts`. Give it the following content:

credentials.ts:
```ts
    export let token = '<put ur token here>'
```

botoptions.ts:
```ts
export let prefix = '<put ur prefix here>' 
export let owners = [
// put an array or a singe string of owner ids here
]
export let errorChannel = "id of channel where errors go to"
export let dmChannel = 'id of the channel were you want dms to the bot to go'
```

Then to start the bot, run `npm start`.
