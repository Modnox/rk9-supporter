module.exports = function rk9supporter(dispatch) {
    const command = dispatch.command || dispatch.require.command;
    const mapID = 3034;
    const huntingZone = 3034;
    const bossID = 3000;
    let enabled = false;
    let checklastboss = true;
    let insidezone = false;
    let insidemap = false;
    let zone = 0;
    let firstskill = '';
    let secondskill = '';
    let tempskill = '';
    let isreverse = false;
    let dungeonmsg = 0;
    let messagecounter = 0;
    let bossunderseventy = false;
    let partyc = false;
    let partys = false;
    let toolboxChat = false;
    let partyn = true;

    dispatch.command.add('rk', (cmd) => {
        switch(cmd) {
            case "partyn":
                partyc = false;
                partys = false;
                partyn = true;
                toolboxChat = false;
                command.message('Messages will now be sent to notice-client-chat chat.')
                break;
            case "partys":
                partyc = false;
                partys = true;
                partyn = true;
                toolboxChat = false;
                command.message('Messages will now be sent to party-server-chat chat.')
                break;
            case "partyc":
                partyc = true;
                partys = false;
                partyn = false;
                toolboxChat = false;
                command.message('Messages will now be sent to party-client-chat chat.')
                break;
            case "tb":
                partyc = false;
                partys = false;
                partyn = false;
                toolboxChat = true;
                command.message('Messages will now be sent to toolbox-chat chat.')
                break;
            default:
                enabled = !enabled
                command.message('rk9supporter ' + (enabled ? 'enabled' : 'disabled'))
        }
    })

    dispatch.hook('S_LOAD_TOPO', 3, (event) => {
        zone = event.zone;
        if (zone === mapID) {
            enabled = true;
            insidemap = true;
            command.message('<br> Welcome to RK-9<br>');
        } else {
            enabled = false;
            insidemap = false;
        }
    });

    dispatch.hook('S_LOGIN', dispatch.majorPatchVersion >= 86 ? 14 : 13, (event) => {
        zone = event.zone;
        setTimeout(function () {
            if (zone === mapID) {
                enabled = true;
                insidemap = true;
            } else {
                enabled = false;
                insidemap = false;
            }
        }, 15000);
    });

    dispatch.hook('S_BOSS_GAGE_INFO', 3, (event) => {
        if (event.huntingZoneId === huntingZone) {
            if (event.templateId === bossID) {
                insidezone = true;
                if (!bossunderseventy) {
                    if (parseInt(event.curHp) / parseInt(event.maxHp) < 0.7) {
                        bossunderseventy = true;
                        sendMessage('Triple S-Bomb from now on.');
                    }
                    if (parseInt(event.curHp) / parseInt(event.maxHp) > 0.99) {
                        firstskill = null;
                        tempskill = null;
                        secondskill = null;
                        checklastboss = true;
                        bossunderseventy = false;
                    }
                }
            }
        }
    })

    dispatch.hook('S_DUNGEON_EVENT_MESSAGE', 2, (event) => {
        if (!enabled) return;
        let msgId = parseInt(event.message.replace('@dungeon:', ''));
        if (msgId === 3034311) { //STANDARD
            isreverse = false;
            firstskill = tempskill;
            secondskill = null;
            messagecounter = 0;
        } else if (msgId === 3034312) { //REVERSE
            isreverse = true;
            secondskill = tempskill;
            firstskill = null;
            messagecounter = 0;
        }
        if (!checklastboss) return;
        if (msgId === 3034302) {
            firstskill = 'OUT';
            tempskill = 'OUT';
            checklastboss = false;
        } else if (msgId === 3034303) {
            firstskill = 'IN';
            tempskill = 'IN';
            checklastboss = false;
        } else if (msgId === 3034304) {
            firstskill = 'WAVE';
            tempskill = 'WAVE';
            checklastboss = false;
        }
    })

    dispatch.hook('S_QUEST_BALLOON', 1, (event) => {
        if (!enabled) return;
        if (insidezone && insidemap) {
            dungeonmsg = parseInt(event.message.replace('@monsterBehavior:', ''));
            if (firstskill === null) { //REVERSE
                if (dungeonmsg === 3034301) {
                    firstskill = 'OUT';
                    tempskill = 'OUT';
                    sendMessage(firstskill + ' + ' + secondskill);
                    secondskill = tempskill;
                    firstskill = null;
                } else if (dungeonmsg === 3034302) {
                    firstskill = 'IN';
                    tempskill = 'IN';
                    sendMessage(firstskill + ' + ' + secondskill);
                    secondskill = tempskill;
                    firstskill = null;
                } else if (dungeonmsg === 3034303) {
                    firstskill = 'WAVE';
                    tempskill = 'WAVE';
                    sendMessage(firstskill + ' + ' + secondskill);
                    secondskill = tempskill;
                    firstskill = null;
                }
            } else if (secondskill === null) { //STANDARD
                if (dungeonmsg === 3034301) {
                    secondskill = 'OUT';
                    tempskill = 'OUT';
                    sendMessage(firstskill + ' + ' + secondskill);
                    firstskill = tempskill;
                    secondskill = null;
                } else if (dungeonmsg === 3034302) {
                    secondskill = 'IN';
                    tempskill = 'IN';
                    sendMessage(firstskill + ' + ' + secondskill);
                    firstskill = tempskill;
                    secondskill = null;
                } else if (dungeonmsg === 3034303) {
                    secondskill = 'WAVE';
                    tempskill = 'WAVE';
                    sendMessage(firstskill + ' + ' + secondskill);
                    firstskill = tempskill;
                    secondskill = null;
                }
            }
            messagecounter = 0;
        }
    });

    dispatch.hook('S_ACTION_STAGE', 9, (event) => {
        if (!enabled) return;
        if (insidezone && insidemap) {
            let skillid = event.skill.id % 1000;
            if ([116, 117, 118, 119].includes(skillid)) {
                if (messagecounter === 3 && bossunderseventy) {
                    if (isreverse) {
                        sendMessage('OUT');
                    } else {
                        sendMessage('IN')
                    }
                    messagecounter = 0;
                }
                messagecounter = messagecounter + 1;
            }
        }
    });

    function sendMessage(msg) {
        if (partyn) {
            dispatch.toClient('S_CHAT', 3, {
                channel: 21, //21 = p-notice, 1 = party
                name: 'RK',
                message: msg
            });
        }

        if (partyc) {
            dispatch.toClient('S_CHAT', 3, {
                channel: 1, //21 = p-notice, 1 = party
                name: 'RK',
                message: msg
            });
        }
        if (partys) {
            setTimeout(function () {
                dispatch.toServer('C_CHAT', 1, {channel: 1, message: msg});
            }, 8000);
        }

        if (toolboxChat){
            command.message(msg)
        }
    }
}