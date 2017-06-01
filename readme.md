# Hammer Time

## What is it?

This Discord bot is a type of *raid prevention*.  I have seen several raids where a bunch of people make accounts and join, all under the **same name**, so this bot will automatically ban people if they match a specific name you have set.

## How to Install and Run

1. Install [node.js](https://nodejs.org/)
2. Install [Discordie](https://github.com/qeled/discordie) using [`npm install discordie`](https://qeled.github.io/discordie/)
3. Download [bot.js](https://github.com/jaketr00/hammer-time/blob/master/bot.js)
4. Make a bot (skip to use an existing bot)
    - Go to the [bots page](https://discordapp.com/developers/applications/me) and click **New App**
5. Make sure it is a bot user
6. Next to **Token** click **click to reveal**
7. Copy the token and paste it between the quotation marks in **line 1** of [bot.js](https://github.com/jaketr00/hammer-time/blob/master/bot.js)
    - Should look like `const botToken = 'yourBotToken';`
8. Open Discord and make sure your have **Developer Mode** enabled
    - Go to **User Settings** > **Appearance** > enable **Developer Mode**
9. Right click (or control+click on mac) your name, then click **Copy ID**
10. Paste your ID between the quotation marks in **line 2** of [bot.js](https://github.com/jaketr00/hammer-time/blob/master/bot.js)
    - Should look like `const ownerID = 'yourDiscordID';`
11. Run `node ./bot.js` from your terminal (make sure to replace `./bot.js` with the directory of the file)
    - This will create several files and folders, the folder location can be defined with the `basedir` constant in **line 4**

## Commands

### Everyone

- `@hammer time#3703 source` displays a link to the bot source (this github page)
- `@hammer time#3703 invite` displays an invite link for the bot to be added to a server

### Server Moderator (must have the **Ban Members** permission)

- `@hammer time#3703 list` sends you a DM of blocked usernames
- `@hammer time#3703 add <name>` adds a blocked username
- `@hammer time#3703 addraw <regex>` adds a blocked username Regular Exponent (remember to escape things meant to be escaped and be to careful with this command)
- `@hammer time#3703 remove <number>` removes a blocked username (use "list" command to get the number)
- `@hammer time#3703 banmsg <text>` what the bot says when it bans
- `@hammer time#3703 bans` send you a DM of the list of bans
- `@hammer time#3703 silentban [yes|no]` enables or disables the "goodbye" message on each ban (no arguments will toggle the state)
- `@hammer time#3703 help` sends you a DM with this help list

### Bot Owner

**All of these commands are done by being sent via a DM to the bot**

- `servers` sends you a dm of all connected servers
- `leave <number>` leaves a connected server (use "servers" command to get the number)
- `blacklisted` lists all blacklisted servers
- `blacklist <id>` blacklists a server
- `unblacklist <number>` removes a server from the blacklist (use "blacklisted" command to get the number)
- `joinnotify [yes|no]` enables or disables dming when joining a server (no arguments will toggle the state)
- `leavenotify [yes|no]` enables or disables dming when leaving a server (no arguments will toggle the state)
- `help` gives you this help list

## Questions?

Feel free to DM me on Discord, `@Jake#1885`