const botToken = ''; //--REQUIRED--
const ownerID = ''; //--REQUIRED--

const basedir = __dirname+'/files/'; //default: __dirname+'/files/'

const http = require('http');
const fs = require('file-system');
const discordie = require('discordie');

const hostname = '127.0.0.1';
const port = 8000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('It\'s Hammer Time');
});

if (!botToken)
    throw 'No Bot Token, please define in "'+__dirname+'/bot.js"';
else if (!ownerID)
    throw 'No Owner ID, please define in "'+__dirname+'/bot.js"';
else
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/`);

        var usernamelist = {},
            bans = {},
            settings = {},
            blacklisted = {},
            globSettings = {},
            loadedGuilds = {};

        fs.readFile(basedir+'blacklisted.json', 'utf8', function (err, data) {
            if (err && err.code === 'ENOENT')
                fs.writeFile(basedir+'blacklisted.json', '{}', function(err) {
                    if (err) throw err;
                });
            else if (err)
                throw err;
            else
                blacklisted = JSON.parse(data);

        });

        fs.readFile(basedir+'settings.json', 'utf8', function (err, data) {
            if (err && err.code === 'ENOENT')
                fs.writeFile(basedir+'settings.json', '{}', function(err) {
                    if (err) throw err;
                });
            else if (err)
                throw err;
            else
                globSettings = JSON.parse(data);

        });

        function ban(member, match, guild) {

            var info = {
                username: member.username,
                discriminator: member.discriminator,
                id: member.id,
                matches: match
            };

            guild.ban(info.id, 0).then(function() {

                if (!settings['_'+guild.id].silentban)
                    guild.generalChannel.sendMessage(settings['_'+guild.id].banmsg+'\n`'+info.username+'#'+info.discriminator+'` ('+info.id+')');
                console.log('banned '+info.username+'#'+info.discriminator+' ('+info.id+')');

                bans['_'+guild.id].push(info);

                fs.writeFile(basedir+'bans/'+guild.id+'.json', JSON.stringify(bans['_'+guild.id]), function(err) {
                    if (err) throw err;

                    bans.length++;

                    fs.writeFile(basedir+'banslength.txt', bans.length.toString(), function(err) {
                        if (err) throw err;
                        client.User.setGame('🔨x'+bans.length);
                    });
                });

            }, function(err) {

                guild.generalChannel.sendMessage('error banning `'+info.username+'#'+info.discriminator+'` ('+info.id+')```'+err+'```');
                console.log('ERROR '+info.username+'#'+info.discriminator+' ('+info.id+')');

            });

        }

        function usernameCheck(member, guild) {
            var name = member.username,
                matches = [];

            for (var i = 0; usernamelist['_'+guild.id].length > i; i++)
                if (name.match(new RegExp(usernamelist['_'+guild.id][i], 'i')))
                    matches.push(usernamelist['_'+guild.id][i]);

            return matches;
        }

        var client = new discordie({autoReconnect: true});

        client.connect({
            token: botToken
        });

        function eachGuild(guild, num) {

            if (typeof loadedGuilds[guild.id] !== 'string') {

                fs.readFile(basedir+'bans/'+guild.id+'.json', 'utf8', function (err, data) {
                    if (err && err.code === 'ENOENT') {
                        bans['_'+guild.id] = [];
                        fs.writeFile(basedir+'bans/'+guild.id+'.json', '[]', function(err) {
                            if (err) throw err;
                        });
                    } else if (err)
                        throw err;
                    else
                        bans['_'+guild.id] = JSON.parse(data);
                });

                fs.readFile(basedir+'settings/'+guild.id+'.json', 'utf8', function (err, data) {
                    if (err && err.code === 'ENOENT') {
                        settings['_'+guild.id] = {
                            banmsg: 'goodbye :hammer:'
                        };
                        fs.writeFile(basedir+'settings/'+guild.id+'.json', JSON.stringify(settings['_'+guild.id]), function(err) {
                            if (err) throw err;
                        });
                    } else if (err)
                        throw err;
                    else
                        settings['_'+guild.id] = JSON.parse(data);
                });

                fs.readFile(basedir+'usernamelist/'+guild.id+'.json', 'utf8', function (err, data) {
                    if (err && err.code === 'ENOENT') {
                        usernamelist['_'+guild.id] = [];
                        fs.writeFile(basedir+'usernamelist/'+guild.id+'.json', '[]', function(err) {
                            if (err) throw err;
                        });
                    } else if (err)
                        throw err;
                    else
                        usernamelist['_'+guild.id] = JSON.parse(data);
                });

                if (usernamelist['_'+guild.id] && usernamelist['_'+guild.id].length)
                    for (var i = 0; guild.members.length > i; i++)
                        if (usernameCheck(guild.members[i], guild).length)
                            ban(guild.members[i], matches, guild);

                if (num)
                    console.log('finished: '+guild.name+' ('+num+'/'+client.Guilds.length+')');

            }

            loadedGuilds[guild.id] = guild.name;

        }

        client.Dispatcher.on('GATEWAY_READY', e => {
            console.log('Connected as: '+client.User.username+'\n');

            fs.readFile(basedir+'banslength.txt', 'utf8', function (err, data) {
                if (err && err.code === 'ENOENT') {
                    bans.length = 0;
                    fs.writeFile(basedir+'banslength.txt', '0', function(err) {
                        if (err) throw err;
                    });
                } else if (err)
                    throw err;
                else
                    bans.length = parseFloat(data);

                client.User.setGame('🔨x'+bans.length);
            });

            var guildcount = 1;

            client.Guilds.forEach(function(guild) {

                if (typeof blacklisted['_'+guild.id] === 'string') {

                    guild.generalChannel.sendMessage('this server has been blacklisted for the following reason```'+(blacklisted['_'+guild.id] ? blacklisted['_'+guild.id] : '(no reason given)')+'```').then(function() {
                        guild.leave();
                    }, function() {
                        guild.leave();
                    });
                    console.log('blacklisted: '+guild.name+' ('+guildcount+'/'+client.Guilds.length+') - '+blacklisted['_'+guild.id])

                } else {

                    eachGuild(guild, guildcount);

                }

                guildcount++;

            });

            client.User.setGame('🔨x'+bans.length);

        });

        /*client.Dispatcher.on('GUILD_MEMBER_REMOVE', e => {

        });*/

        client.Dispatcher.on('GUILD_MEMBER_ADD', e => {

            var matches = usernameCheck(e.member, e.guild);

            if (matches.length)
                ban(e.member, matches, e.guild);

        });

        client.Dispatcher.on('GUILD_DELETE', e => {

            if (!globSettings.noLeaveNotify)
                client.Users.get(ownerID).openDM().then(function(dm) {
                    dm.sendMessage('left server `'+loadedGuilds[e.guildId]+'` ('+e.guildId+')');
                    delete loadedGuilds[e.guildId];
                }, function() {
                    console.log('unable to open dm')
                    delete loadedGuilds[e.guildId];
                });

        });

        client.Dispatcher.on('GUILD_CREATE', e => {
            console.log('joined: '+e.guild.name+' ('+e.guild.id+')');

            if (!globSettings.noJoinNotify)
                client.Users.get(ownerID).openDM().then(function(dm) {
                    dm.sendMessage('joined server `'+e.guild.name+'` ('+e.guild.id+')');
                }, function() {
                    console.log('unable to open dm')
                });

            if (typeof blacklisted['_'+e.guild.id] === 'string') {

                e.guild.generalChannel.sendMessage('this server has been blacklisted for the following reason```'+(blacklisted['_'+e.guild.id] ? blacklisted['_'+e.guild.id] : '(no reason given)')+'```').then(function() {
                    e.guild.leave();
                }, function() {
                    e.guild.leave();
                });
                console.log('left server, blacklisted ('+blacklisted['_'+e.guild.id]+')')

            } else {

                eachGuild(e.guild, null);

                e.guild.generalChannel.sendMessage('I am **'+client.User.username+'**\nType `@'+client.User.username+'#'+client.User.discriminator+' help` for help');

            }
        });

        client.Dispatcher.on('MESSAGE_CREATE', e => {
            if (!e.message.isPrivate)
                loadedGuilds[e.message.guild.id] = e.message.guild.name;

            if (!e.message.author.bot) {

                var priorityCommands = ['invite', 'invitelink', 'link', 'git', 'github', 'source'];
                if ((e.message.isPrivate || e.message.content.match(new RegExp('^<@.{0,1}'+client.User.id+'> *'))) && priorityCommands.indexOf(e.message.content.replace(new RegExp('<@.{0,1}'+client.User.id+'> *'), '').toLowerCase())) {

                    switch(e.message.content.replace(new RegExp('<@.{0,1}'+client.User.id+'> *'), '').toLowerCase()) {

                        case 'invite':
                        case 'invitelink':
                        case 'link':

                            e.message.channel.sendMessage('https://discordapp.com/oauth2/authorize?client_id='+client.User.id+'&scope=bot&permissions=4');
                            break;

                        /*Start - Do Not Remove*/
                        //if removed, make sure this link (https://github.com/jaketr00/hammer-time) is somewhere that can be accessed easily by the user

                        case 'git':
                        case 'github':
                        case 'source':

                            e.message.channel.sendMessage('https://github.com/jaketr00/hammer-time');
                            break;

                        /*End - Do Not Remove*/

                    }

                } else if (!e.message.isPrivate && e.message.author.permissionsFor(e.message.channel)['General']['BAN_MEMBERS'] && e.message.content.match(new RegExp('^<@.{0,1}'+client.User.id+'> '))) {
                    var msg = e.message.content.replace(new RegExp('<@.{0,1}'+client.User.id+'> '), '').toLowerCase(),
                        command = msg.split(' ')[0],
                        args = msg.replace(new RegExp('^'+command+' *'), '');

                    switch(command) {
                        case 'list':

                            e.message.author.openDM().then(function(dmc) {

                                if (usernamelist['_'+e.message.guild.id].length) {

                                    var start = 'Blocked Names for **'+e.message.guild.name+'**',
                                        MdS = '```',
                                        MdE = '```',
                                        first = true;

                                    var textCount = 0,
                                        textLength = 0;

                                    textCount+= (start+MdS).length;

                                    var maxLength = 2000-MdE.length;

                                    var text = [];
                                    text[0] = start+MdS;

                                    for (var i = 0; usernamelist['_'+e.message.guild.id].length > i; i++) {
                                        var humannum = i+1,
                                            textnum = humannum < 10 ? '00'+humannum.toString() : (humannum < 100 ? '0'+humannum.toString() : humannum.toString());

                                        var toAdd = '#'+textnum+' | '+usernamelist['_'+e.message.guild.id][i];
                                        if (!first)
                                            toAdd = '\n'+toAdd;

                                        if (textCount+toAdd.length > maxLength) {
                                            text[textLength]+= MdE;
                                            textLength++;
                                            textCount = MdS.length;
                                            text[textLength] = MdS+toAdd;
                                            first = true;
                                        } else {
                                            textCount+= toAdd.length;
                                            text[textLength]+= toAdd;
                                            first = false;
                                        }
                                    }
                                    text[textLength]+= MdE;

                                    for (var i = 0; text.length > i; i++) {
                                        dmc.sendMessage(text[i]);
                                    }
                                } else
                                    dmc.sendMessage('No blocked names for **'+e.message.guild.name+'**');

                            }, function() {
                                e.message.channel.sendMessage('unable to open a dm');
                            });

                            break;
                        case 'add':

                            if (args) {

                                args = args.replace(/[.?!$^\\\/\-*+]/, function(c) {
                                    return '\\'+c;
                                });

                                if (usernamelist['_'+e.message.guild.id].indexOf(args)+1)
                                    e.message.channel.sendMessage('**'+args+'** has already been added');
                                else {

                                    usernamelist['_'+e.message.guild.id].push(args);

                                    fs.writeFile(basedir+'usernamelist/'+e.message.guild.id+'.json', JSON.stringify(usernamelist), function(err) {
                                        if (err) throw err;
                                        e.message.channel.sendMessage('added **'+args+'** to blocked names');
                                    });

                                }
                            }

                            break;
                        case 'addraw':

                            if (args) {

                                if (usernamelist['_'+e.message.guild.id].indexOf(args)+1)
                                    e.message.channel.sendMessage('**'+args+'** has already been added');
                                else {

                                    usernamelist['_'+e.message.guild.id].push(args);

                                    fs.writeFile(basedir+'usernamelist/'+e.message.guild.id+'.json', JSON.stringify(usernamelist), function(err) {
                                        if (err) throw err;
                                        e.message.channel.sendMessage('added **'+args+'** to blocked names');
                                    });

                                }
                            }

                            break;
                        case 'remove':

                            if (args && args.match(/^[0-9]*$/)) {

                                args = parseInt(args)-1;

                                if (usernamelist['_'+e.message.guild.id][args]) {

                                    var name = usernamelist['_'+e.message.guild.id][args];

                                    usernamelist['_'+e.message.guild.id].splice(args, 1);

                                    fs.writeFile(basedir+'usernamelist/'+e.message.guild.id+'.json', JSON.stringify(usernamelist['_'+e.message.guild.id]), function(err) {
                                        if (err) throw err;
                                        e.message.channel.sendMessage('removed **'+name+'** from blocked names');
                                    });

                                } else
                                    e.message.channel.sendMessage('**'+(args+1)+'** is not a valid number to be removed');

                            }

                            break;
                        case 'bans':

                            e.message.author.openDM().then(function(dmc) {

                                if (bans['_'+e.message.guild.id].length) {

                                    var start = 'Bans for **'+e.message.guild.name+'**',
                                        MdS = '```diff\n',
                                        MdE = '```',
                                        first = true;

                                    var textCount = 0,
                                        textLength = 0;

                                    textCount+= (start+MdS).length;

                                    var maxLength = 2000-MdE.length;

                                    var text = [];
                                    text[0] = start+MdS;

                                    for (var i = 0; bans['_'+e.message.guild.id].length > i; i++) {
                                        var humannum = i+1,
                                            textnum = humannum < 10 ? '00'+humannum.toString() : (humannum < 100 ? '0'+humannum.toString() : humannum.toString());

                                        var toAdd = '- '+bans['_'+e.message.guild.id][i].username+'#'+bans['_'+e.message.guild.id][i].discriminator+' ('+bans['_'+e.message.guild.id][i].id+') / '+bans['_'+e.message.guild.id][i].matches.join(',');
                                        if (!first)
                                            toAdd = '\n'+toAdd;

                                        if (textCount+toAdd.length > maxLength) {
                                            text[textLength]+= MdE;
                                            textLength++;
                                            textCount = MdS.length;
                                            text[textLength] = MdS+toAdd;
                                            first = true;
                                        } else {
                                            textCount+= toAdd.length;
                                            text[textLength]+= toAdd;
                                            first = false;
                                        }
                                    }
                                    text[textLength]+= MdE;

                                    for (var i = 0; text.length > i; i++) {
                                        dmc.sendMessage(text[i]);
                                    }

                                } else
                                    dmc.sendMessage('No bans from **'+e.message.guild.name+'**');

                            }, function() {
                                e.message.channel.sendMessage('unable to open a dm');
                            });

                            break;
                        case 'banmsg':

                            if (args) {

                                settings['_'+e.message.guild.id].banmsg = args;

                                fs.writeFile(basedir+'settings/'+e.message.guild.id+'.json', JSON.stringify(settings['_'+e.message.guild.id]), function(err) {
                                    if (err) throw err;
                                    e.message.channel.sendMessage('ban message set to **'+args+'**');
                                });

                            }

                            break;
                        case 'silentban':

                            var setTo;

                            switch(args) {
                                case 'on':
                                case 'true':
                                case '1':
                                case 'yes':
                                    setTo = true;
                                    break;
                                case 'off':
                                case 'false':
                                case '0':
                                case 'no':
                                    setTo = false;
                                    break;
                                default:
                                    setTo = !settings['_'+e.message.guild.id].silentban;
                                    break;
                            }

                            if (setTo !== settings['_'+e.message.guild.id].silentban) {

                                settings['_'+e.message.guild.id].silentban = setTo;

                                fs.writeFile(basedir+'settings/'+e.message.guild.id+'.json', JSON.stringify(settings['_'+e.message.guild.id]), function(err) {
                                    if (err) throw err;
                                    e.message.channel.sendMessage('silent ban has been **'+(setTo ? 'enabled' : 'disabled')+'**');
                                });

                            } else
                                e.message.channel.sendMessage('silent ban is already **'+(setTo ? 'enabled' : 'disabled')+'**');

                            break;
                        case 'help':
                            e.message.author.openDM().then(function(dmc) {

                                var help = [
                                    'list: sends you a dm of blocked usernames',
                                    'add <name>: adds a blocked username',
                                    'addraw <regex>: adds a blocked username Regular Exponent (remember to escape things meant to be escaped and be to careful with this command)',
                                    'remove <number>: removes a blocked username (use "list" command to get the number)',
                                    'banmsg <text>: what the bot says when it bans',
                                    'bans: send you a dm of the list of bans',
                                    'silentban [yes|no]: enables or disables the "goodbye" message on each ban (no arguments will toggle the state)',
                                    'help: if you really need help with this command, then you need help with a number of other things too'
                                ];

                                dmc.sendMessage('help```md\n# '+help.join('\n# ')+'\n```');

                            }, function() {
                                e.message.channel.sendMessage('unable to open a dm');
                            });
                            break;
                    }

                } else if (e.message.isPrivate && e.message.author.id === ownerID) {
                    var command = e.message.content.split(' ')[0].toLowerCase(),
                        args = e.message.content.replace(new RegExp('^'+command+' *'), '').toLowerCase();

                    switch(command) {
                        case 'servers':

                            if (client.Guilds.length) {

                                var start = 'Servers',
                                    MdS = '```md\n',
                                    MdE = '```',
                                    first = true;

                                var textCount = 0,
                                    textLength = 0;

                                textCount+= (start+MdS).length;

                                var maxLength = 2000-MdE.length;

                                var text = [];
                                text[0] = start+MdS;

                                var i = 0;
                                client.Guilds.forEach(function(guild) {

                                    var humannum = i+1,
                                        textnum = humannum < 10 ? '00'+humannum.toString() : (humannum < 100 ? '0'+humannum.toString() : humannum.toString());

                                    var toAdd = '#'+textnum+' '+guild.name+' ('+guild.id+')';
                                    if (!first)
                                        toAdd = '\n'+toAdd;

                                    if (textCount+toAdd.length > maxLength) {
                                        text[textLength]+= MdE;
                                        textLength++;
                                        textCount = MdS.length;
                                        text[textLength] = MdS+toAdd;
                                        first = true;
                                    } else {
                                        textCount+= toAdd.length;
                                        text[textLength]+= toAdd;
                                        first = false;
                                    }

                                    i++;

                                });

                                text[textLength]+= MdE;

                                for (var i = 0; text.length > i; i++) {
                                    e.message.channel.sendMessage(text[i]);
                                }

                            } else
                                e.message.channel.sendMessage('no servers');

                            break;
                        case 'leave':

                            if (args && args.match(/^[0-9]*$/)) {

                                args = parseInt(args)-1;

                                var guilds = client.Guilds.toArray();

                                if (guilds[args]) {
                                    var id  = guilds[args].id;
                                    console.log('leaving: '+guilds[args].name+' ('+guilds[args].id+')');
                                    e.message.channel.sendMessage('leaving **'+guilds[args].name+'** ('+guilds[args].id+')');
                                    guilds[args].leave().then(function() {
                                        if (!globSettings.noLeaveNotify)
                                            e.message.channel.sendMessage('left');
                                    }, function() {
                                        e.message.channel.sendMessage('error leaving');
                                    });
                                } else
                                    e.message.channel.sendMessage('**'+(args+1)+'** is not a valid server number to leave');

                            }

                            break;
                        case 'blacklisted':

                            if (client.Guilds.length) {

                                var start = 'Blacklisted Servers',
                                    MdS = '```diff\n',
                                    MdE = '```',
                                    first = true;

                                var textCount = 0,
                                    textLength = 0;

                                textCount+= (start+MdS).length;

                                var maxLength = 2000-MdE.length;

                                var text = [];
                                text[0] = start+MdS;

                                for (var key in blacklisted) {

                                    var toAdd = '- '+key.replace(/^_/, '')+' ('+(blacklisted[key] ? blacklisted[key] : 'no reason given')+')';
                                    if (!first)
                                        toAdd = '\n'+toAdd;

                                    if (textCount+toAdd.length > maxLength) {
                                        text[textLength]+= MdE;
                                        textLength++;
                                        textCount = MdS.length;
                                        text[textLength] = MdS+toAdd;
                                        first = true;
                                    } else {
                                        textCount+= toAdd.length;
                                        text[textLength]+= toAdd;
                                        first = false;
                                    }

                                }

                                text[textLength]+= MdE;

                                for (var i = 0; text.length > i; i++) {
                                    e.message.channel.sendMessage(text[i]);
                                }

                            } else
                                e.message.channel.sendMessage('no blacklisted servers');

                            break;
                        case 'blacklist':

                            if (args && args.match(/^[0-9]{18}/)) {

                                var id = args.split(' ')[0],
                                    reason = args.replace(new RegExp('^'+id+' *'), '');

                                blacklisted['_'+id] = reason;

                                fs.writeFile(basedir+'blacklisted.json', JSON.stringify(blacklisted), function(err) {
                                    if (err) throw err;
                                    e.message.channel.sendMessage('server `'+args+'` is now blacklisted for '+(reason ? 'the reason```'+reason+'```' : '**no reason**'));
                                });

                                if (client.Guilds.get(id))
                                    client.Guilds.get(id).generalChannel.sendMessage('this server has been blacklisted for the following reason```'+(blacklisted['_'+client.Guilds.get(id).id] ? blacklisted['_'+client.Guilds.get(id).id] : '(no reason given)')+'```').then(function() {
                                        client.Guilds.get(id).leave();
                                    }, function() {
                                        client.Guilds.get(id).leave();
                                    });

                            }

                            break;
                        case 'unblacklist':

                            if (args && args.match(/^[0-9]{18}$/)) {

                                if (typeof blacklisted['_'+args] === 'string') {

                                    delete blacklisted['_'+args];

                                    fs.writeFile(basedir+'blacklisted.json', JSON.stringify(blacklisted), function(err) {
                                        if (err) throw err;
                                        e.message.channel.sendMessage('server `'+args+'` is no longer blacklisted');
                                    });

                                } else
                                    e.message.channel.sendMessage('server `'+args+'` was not blacklisted');

                            }

                            break;
                        case 'joinnotify':

                            var setTo;

                            switch(args) {
                                case 'on':
                                case 'true':
                                case '1':
                                case 'yes':
                                    setTo = false;
                                    break;
                                case 'off':
                                case 'false':
                                case '0':
                                case 'no':
                                    setTo = true;
                                    break;
                                default:
                                    setTo = !globSettings.noJoinNotify;
                                    break;
                            }

                            if (setTo !== globSettings.noJoinNotify) {

                                globSettings.noJoinNotify = setTo;

                                fs.writeFile(basedir+'settings.json', JSON.stringify(globSettings), function(err) {
                                    if (err) throw err;
                                    e.message.channel.sendMessage('guild join notifications has been **'+(setTo ? 'disabled' : 'enabled')+'**');
                                });

                            } else
                                e.message.channel.sendMessage('guild join notifications is already **'+(setTo ? 'disabled' : 'enabled')+'**');

                            break;
                        case 'leavenotify':

                            var setTo;

                            switch(args) {
                                case 'on':
                                case 'true':
                                case '1':
                                case 'yes':
                                    setTo = false;
                                    break;
                                case 'off':
                                case 'false':
                                case '0':
                                case 'no':
                                    setTo = true;
                                    break;
                                default:
                                    setTo = !globSettings.noLeaveNotify;
                                    break;
                            }

                            if (setTo !== globSettings.noLeaveNotify) {

                                globSettings.noLeaveNotify = setTo;

                                fs.writeFile(basedir+'settings.json', JSON.stringify(globSettings), function(err) {
                                    if (err) throw err;
                                    e.message.channel.sendMessage('guild leave notifications has been **'+(setTo ? 'disabled' : 'enabled')+'**');
                                });

                            } else
                                e.message.channel.sendMessage('guild leave notifications is already **'+(setTo ? 'disabled' : 'enabled')+'**');

                            break;
                        case 'help':

                            var help = [
                                'servers: sends you a dm of all connected servers',
                                'leave <number>: leaves a connected server (use "servers" command to get the number)',
                                'blacklisted: lists all blacklisted servers',
                                'blacklist <id>: blacklists a server',
                                'unblacklist <number>: removes a server from the blacklist (use "blacklisted" command to get the number)',
                                'joinnotify [yes|no]: enables or disables dming when joining a server (no arguments will toggle the state)',
                                'leavenotify [yes|no]: enables or disables dming when leaving a server (no arguments will toggle the state)',
                                'help: if you really need help with this command, then you need help with a number of other things too'
                            ];

                            e.message.channel.sendMessage('bot owner help```md\n# '+help.join('\n# ')+'\n```');
                            break;
                    }

                }

            }

        });

    });